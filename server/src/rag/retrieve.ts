import type { Db } from "../db/database";
import type { EmbeddingConfig } from "../config/env";
import { embed } from "./embed";
import { queryTerms, tokenize, type QueryTerm } from "./text";
import { logger, describeError } from "../whatsapp/logger";

export { tokenize };
export type Embedder = (texts: string[], inputType: "query" | "passage") => Promise<number[][]>;

export function makeEmbedder(config: EmbeddingConfig | null): Embedder | null {
  return config ? (texts, inputType) => embed(config, texts, inputType) : null;
}

export function toBlob(vector: number[]): Uint8Array {
  const bytes = new Uint8Array(vector.length * 4);
  const view = new DataView(bytes.buffer);
  vector.forEach((value, index) => view.setFloat32(index * 4, value, true));
  return bytes;
}

export function fromBlob(blob: Uint8Array): Float32Array {
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const out = new Float32Array(blob.byteLength / 4);
  for (let index = 0; index < out.length; index += 1) out[index] = view.getFloat32(index * 4, true);
  return out;
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const x = a[index] ?? 0, y = b[index] ?? 0;
    dot += x * y; normA += x * x; normB += y * y;
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

export interface RetrievedChunk { source: string; content: string; score: number }

interface Doc { source: string; content: string; tokens: string[]; counts: Map<string, number>; headingTokens: Set<string>; embedding: Uint8Array | null }
interface Corpus { key: string; docs: Doc[]; df: Map<string, number>; avgLen: number }

let corpusCache: Corpus | null = null;

/** Korpus di-tokenize sekali per perubahan isi rag_chunks (kunci: jumlah + id terbesar + versi). */
function loadCorpus(db: Db): Corpus {
  const meta = db.prepare("SELECT COUNT(*) AS n, COALESCE(MAX(id), 0) AS last, COALESCE(SUM(LENGTH(content)), 0) AS chars FROM rag_chunks").get();
  const key = `${meta?.n}:${meta?.last}:${meta?.chars}`;
  if (corpusCache?.key === key) return corpusCache;
  const docs: Doc[] = db.prepare("SELECT source, content, embedding FROM rag_chunks ORDER BY id").all().map((row) => {
    const content = String(row.content);
    const tokens = tokenize(content);
    const counts = new Map<string, number>();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    const heading = /^\[([^\]]+)\]/.exec(content)?.[1] ?? "";
    return { source: String(row.source), content, tokens, counts, headingTokens: new Set(tokenize(heading)), embedding: (row.embedding as Uint8Array | null) ?? null };
  });
  const df = new Map<string, number>();
  for (const doc of docs) for (const token of doc.counts.keys()) df.set(token, (df.get(token) ?? 0) + 1);
  corpusCache = { key, docs, df, avgLen: docs.reduce((sum, doc) => sum + doc.tokens.length, 0) / Math.max(1, docs.length) };
  return corpusCache;
}

const K1 = 1.2;
const B = 0.75;
const RRF_K = 60;

/** BM25 atas token ter-stem; istilah sinonim berbobot 0.6; cocok dengan judul bagian dapat bonus 1.6x. */
function bm25(corpus: Corpus, terms: QueryTerm[]): number[] {
  const total = corpus.docs.length;
  return corpus.docs.map((doc) => {
    let score = 0;
    for (const { term, weight } of terms) {
      const tf = doc.counts.get(term) ?? 0;
      if (tf === 0) continue;
      const df = corpus.df.get(term) ?? 0;
      const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5));
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * (doc.tokens.length / (corpus.avgLen || 1))));
      score += weight * idf * norm * (doc.headingTokens.has(term) ? 1.6 : 1);
    }
    return score;
  });
}

/**
 * Pencarian hibrida atas rag_chunks:
 * - BM25 dengan stemmer Indonesia + ekspansi sinonim/bahasa gaul SELALU aktif (RAG jalan tanpa API apa pun);
 * - bila embedder tersedia dan ada vektor, hasil digabung dengan Reciprocal Rank Fusion (tahan beda skala skor);
 * - hasil di bawah ambang relevansi dibuang sehingga bot berani menjawab "belum tahu" alih-alih mengarang.
 * Kegagalan embedding tidak pernah membuat pencarian gagal.
 */
export async function retrieve(db: Db, embedder: Embedder | null, query: string, limit = 4): Promise<RetrievedChunk[]> {
  const corpus = loadCorpus(db);
  if (corpus.docs.length === 0) return [];

  const terms = queryTerms(query);
  const keyword = bm25(corpus, terms);
  // Kekuatan cakupan: kata asli yang jarang di korpus atau istilah domain (via sinonim) bernilai 1; kata asli yang
  // umum (mis. "harga" ada di banyak potongan) hanya 0.4. Pertanyaan panjang perlu total >= 1, jadi satu kata umum
  // yang kebetulan sama ("harga bitcoin hari ini") tidak cukup untuk dianggap relevan.
  const conceptIds = [...new Set(terms.flatMap((term) => term.concepts))];
  const coverage = corpus.docs.map((doc) => {
    let strength = 0;
    for (const concept of conceptIds) {
      let best = 0;
      for (const term of terms) {
        if (!term.concepts.includes(concept) || !doc.counts.has(term.term)) continue;
        const rare = (corpus.df.get(term.term) ?? 0) / corpus.docs.length <= 0.1;
        best = Math.max(best, term.weight < 1 || rare ? 1 : 0.4);
      }
      strength += best;
    }
    return strength;
  });
  const topKeyword = Math.max(...keyword, 0);

  let vector: number[] | null = null;
  if (embedder && corpus.docs.some((doc) => doc.embedding)) {
    try {
      const [queryVector] = await embedder([query], "query");
      if (queryVector) vector = corpus.docs.map((doc) => (doc.embedding ? cosine(queryVector, fromBlob(doc.embedding)) : 0));
    } catch (error: unknown) {
      logger.warn("Embedding query gagal, memakai pencarian kata kunci saja.", { error: describeError(error) });
    }
  }

  const indices = corpus.docs.map((_, index) => index);
  const keywordRank = new Map([...indices].sort((a, b) => (keyword[b] ?? 0) - (keyword[a] ?? 0)).map((index, rank) => [index, rank]));
  const vectorRank = vector ? new Map([...indices].sort((a, b) => (vector[b] ?? 0) - (vector[a] ?? 0)).map((index, rank) => [index, rank])) : null;

  const ranked = indices
    .map((index) => {
      const k = keyword[index] ?? 0;
      const v = vector?.[index] ?? 0;
      // Relevan bila kata kunci cukup kuat dibanding yang terbaik, atau kemiripan vektor tinggi.
            const relevant = (k > 0 && k >= 0.3 * topKeyword && (conceptIds.length <= 2 || (coverage[index] ?? 0) >= 1)) || v >= 0.45;
      const fused = (k > 0 ? 1 / (RRF_K + (keywordRank.get(index) ?? 0)) : 0) + (vectorRank && v > 0 ? 1 / (RRF_K + (vectorRank.get(index) ?? 0)) : 0);
      return { index, relevant, score: vectorRank ? fused : k };
    })
    .filter((entry) => entry.relevant)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  logger.info("Retrieve RAG selesai.", { queryLength: query.length, matched: ranked.length, mode: vector ? "hybrid" : "keyword" });
  return ranked.map(({ index, score }) => ({ source: corpus.docs[index]?.source ?? "", content: corpus.docs[index]?.content ?? "", score }));
}

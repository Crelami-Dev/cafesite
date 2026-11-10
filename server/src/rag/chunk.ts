const MAX_CHUNK = 600;

const FOOTER = [/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/i, /^\s*(halaman|page|hal\.?)\s*\d+(\s*(dari|of|\/)\s*\d+)?\s*$/i, /^\s*\d+\s*$/];

interface Heading { level: number; title: string }

/** Judul: "# Markdown", baris pendek berakhiran ":" , atau baris HURUF BESAR pendek. */
function parseHeading(line: string): Heading | null {
  const trimmed = line.trim();
  const markdown = /^(#{1,6})\s+(.+?)\s*#*$/.exec(trimmed);
  if (markdown?.[1] && markdown[2]) return { level: markdown[1].length, title: markdown[2] };
  if (trimmed.length <= 60 && /:$/.test(trimmed) && !/[.!?]\s/.test(trimmed)) return { level: 3, title: trimmed.slice(0, -1).trim() };
  if (trimmed.length >= 4 && trimmed.length <= 60 && trimmed === trimmed.toUpperCase() && /[A-Z]{3}/.test(trimmed) && !/[.!?]$/.test(trimmed)) return { level: 3, title: trimmed };
  return null;
}

function splitLong(line: string): string[] {
  if (line.length <= MAX_CHUNK) return [line];
  const sentences = line.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    if (sentence.length > MAX_CHUNK) {
      if (buffer) { out.push(buffer); buffer = ""; }
      for (let start = 0; start < sentence.length; start += MAX_CHUNK - 60) out.push(sentence.slice(start, start + MAX_CHUNK));
      continue;
    }
    if (buffer && buffer.length + 1 + sentence.length > MAX_CHUNK) { out.push(buffer); buffer = sentence; }
    else buffer = buffer ? `${buffer} ${sentence}` : sentence;
  }
  if (buffer) out.push(buffer);
  return out;
}

/**
 * Pecah dokumen per bagian berjudul. Setiap potongan diawali "[Judul > Subjudul]" sehingga pencarian
 * dan AI tahu konteksnya ("Senin–Kamis 08.00" di bawah "Jam Operasional"), bukan teks tanpa label.
 * Footer halaman dibuang; bagian panjang dipecah per kalimat (≤ ~600 karakter) dengan satu unit tumpang tindih.
 */
export function chunkText(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd()).filter((line) => !FOOTER.some((pattern) => pattern.test(line)));
  const sections: { path: string[]; body: string[] }[] = [];
  const stack: Heading[] = [];
  let current: { path: string[]; body: string[] } = { path: [], body: [] };
  const flush = (): void => { if (current.body.some((line) => line.trim())) sections.push(current); };

  for (const line of lines) {
    const heading = parseHeading(line);
    if (heading) {
      flush();
      while (stack.length && (stack.at(-1)?.level ?? 0) >= heading.level) stack.pop();
      stack.push(heading);
      current = { path: stack.map((entry) => entry.title).slice(-2), body: [] };
    } else if (line.trim()) current.body.push(line.trim());
  }
  flush();

  const chunks: string[] = [];
  for (const section of sections) {
    const label = section.path.length ? `[${section.path.join(" > ")}]\n` : "";
    const units = section.body.flatMap(splitLong);
    let buffer: string[] = [];
    let size = 0;
    const emit = (): void => { if (buffer.length) chunks.push(`${label}${buffer.join("\n")}`); };
    for (const unit of units) {
      if (buffer.length && size + unit.length > MAX_CHUNK) {
        emit();
        const last = buffer.at(-1) ?? "";
        buffer = last.length < 160 ? [last] : [];
        size = buffer.join("\n").length;
      }
      buffer.push(unit);
      size += unit.length + 1;
    }
    emit();
  }
  return chunks;
}

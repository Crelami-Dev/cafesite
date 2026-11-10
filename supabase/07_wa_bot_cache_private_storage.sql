-- Apply after 06_wa_bot_dashboard.sql.
-- RAG source files are private: browser upload is authorized by policy, bot reads with service_role.
update storage.buckets set public = false where id = 'wa-bot-rag';

create table if not exists public.wa_bot_answer_cache (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  embedding halfvec(2048) not null,
  answer text not null,
  scope text not null default 'rag',
  source_fingerprint text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists wa_bot_answer_cache_embedding_idx on public.wa_bot_answer_cache using hnsw (embedding halfvec_cosine_ops);
create index if not exists wa_bot_answer_cache_expiry_idx on public.wa_bot_answer_cache(expires_at);
alter table public.wa_bot_answer_cache enable row level security;
revoke all on public.wa_bot_answer_cache from public, anon, authenticated;
grant select, insert, update, delete on public.wa_bot_answer_cache to service_role;

create or replace function public.match_wa_bot_answer_cache(query_embedding halfvec(2048), fingerprint text, min_similarity float default 0.92)
returns table(answer text, similarity float) language sql stable security definer set search_path = public as $$
 select answer, 1 - (embedding <=> query_embedding) from public.wa_bot_answer_cache
 where expires_at > now() and source_fingerprint = fingerprint and 1 - (embedding <=> query_embedding) >= min_similarity
 order by embedding <=> query_embedding limit 1;
$$;
revoke all on function public.match_wa_bot_answer_cache(halfvec,text,float) from public, anon, authenticated;
grant execute on function public.match_wa_bot_answer_cache(halfvec,text,float) to service_role;

create or replace function public.invalidate_wa_bot_answer_cache() returns trigger language plpgsql security definer set search_path = public as $$ begin delete from public.wa_bot_answer_cache; return null; end $$;
drop trigger if exists rag_cache_invalidation on public.rag_documents;
create trigger rag_cache_invalidation after insert or update or delete on public.rag_documents for each statement execute function public.invalidate_wa_bot_answer_cache();

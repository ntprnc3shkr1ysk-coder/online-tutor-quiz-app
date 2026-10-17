create table public.vocab_cards (
 id text primary key,
 term text not null,
 meaning text not null,
 example text not null,
 translation text not null,
 note text not null default '',
 lessons jsonb not null check (jsonb_typeof(lessons) = 'array'),
 sort_order integer not null default 0
);
create table public.vocab_reviews (
 seq bigint generated always as identity primary key,
 event_id uuid not null unique,
 card_id text not null references public.vocab_cards(id),
 initial_remembered smallint not null check(initial_remembered in(0,1)),
 remembered smallint not null check(remembered in(0,1)),
 corrected smallint not null default 0 check(corrected in(0,1)),
 session_id uuid not null,
 access_hash text not null default '567f7f943e4141d857fcbf8ed4883414fcbaa6ab874775f3f5c7ecccd9ec60ab',
 created_at timestamptz not null default now(),
 constraint vocab_review_correction_valid check (
  (corrected=0 and remembered=initial_remembered) or
  (corrected=1 and initial_remembered=1 and remembered=0)
 )
);
create index vocab_reviews_card_seq_idx on public.vocab_reviews(card_id,seq desc);
alter table public.vocab_cards enable row level security;
alter table public.vocab_reviews enable row level security;
revoke all on public.vocab_cards from anon,authenticated;
revoke all on public.vocab_reviews from anon,authenticated;
grant select on public.vocab_cards to anon,authenticated;
grant select on public.vocab_reviews to anon,authenticated;
grant insert(event_id,card_id,initial_remembered,remembered,session_id) on public.vocab_reviews to anon,authenticated;
grant update(remembered,corrected) on public.vocab_reviews to anon,authenticated;
grant usage on sequence public.vocab_reviews_seq_seq to anon,authenticated;
create policy vocab_cards_shared_read on public.vocab_cards for select to anon,authenticated using(true);
-- User requested login-free sharing of one student's history between teacher and student.
-- A 256-bit capability in their shared URL is required. Publishable API keys alone give no history access.
-- Only the hash is stored here; the plaintext capability is not included in public source.
create policy vocab_reviews_link_read on public.vocab_reviews for select to anon,authenticated using(
 access_hash=encode(extensions.digest(coalesce(current_setting('request.headers',true)::jsonb->>'x-vocab-key',''),'sha256'),'hex')
);
create policy vocab_reviews_link_insert on public.vocab_reviews for insert to anon,authenticated with check(
 corrected=0 and initial_remembered=remembered and
 access_hash=encode(extensions.digest(coalesce(current_setting('request.headers',true)::jsonb->>'x-vocab-key',''),'sha256'),'hex')
);
create policy vocab_reviews_correct_known on public.vocab_reviews for update to anon,authenticated using(
 initial_remembered=1 and access_hash=encode(extensions.digest(coalesce(current_setting('request.headers',true)::jsonb->>'x-vocab-key',''),'sha256'),'hex')
) with check(
 initial_remembered=1 and remembered=0 and corrected=1 and
 access_hash=encode(extensions.digest(coalesce(current_setting('request.headers',true)::jsonb->>'x-vocab-key',''),'sha256'),'hex')
);
create function public.vocab_snapshot() returns jsonb language sql stable security invoker set search_path='' as $function$
 with summaries as (
  select card_id,max(seq) latest,count(*) total,
   count(*) filter(where remembered=0) missed
  from public.vocab_reviews group by card_id
 ), progress as (
  select r.card_id,r.remembered,r.created_at,s.total,s.missed
  from public.vocab_reviews r join summaries s on r.seq=s.latest
 ), recent as (
  select seq,event_id,card_id,initial_remembered,remembered,corrected,session_id,created_at from public.vocab_reviews order by seq desc limit 200
 ), totals as (
  select count(*) total,coalesce(sum(remembered),0) known,coalesce(sum(corrected),0) corrected
  from public.vocab_reviews
 )
 select jsonb_build_object(
  'progress',coalesce((select jsonb_agg(to_jsonb(p)) from progress p),'[]'::jsonb),
  'history',coalesce((select jsonb_agg(to_jsonb(h) order by h.seq desc) from recent h),'[]'::jsonb),
  'totals',(select to_jsonb(t) from totals t)
 );
$function$;
revoke all on function public.vocab_snapshot() from public;
grant execute on function public.vocab_snapshot() to anon,authenticated;
notify pgrst,'reload schema';


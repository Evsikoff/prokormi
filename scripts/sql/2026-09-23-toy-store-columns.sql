-- Adds to monster_data_mart the columns used by toy store rows
-- (object_type 'Item from the toy store', initial ids 314–323 and new ids 421–446).
-- already have in monster_data_mart_rows.json. Safe to run again: existing columns are skipped.
-- Run in Supabase → SQL Editor, then `npm run data:push -- --dry-run`.

alter table public.monster_data_mart
  add column if not exists store_id bigint null,              -- id of the store row (313 = toy store)
  add column if not exists toy_key text null,                 -- stable UI key: 'book', 'capsule', …
  add column if not exists toy_zone text null,                -- 'learning', …
  add column if not exists age_mark text null,                -- '5+', …
  add column if not exists fact_text text null,               -- what the toy is for
  add column if not exists fine_print text null,              -- small print on the box
  add column if not exists mood_change smallint null,         -- bonus to mood, including +5 for later toys
  add column if not exists development_change smallint null,  -- 0 … 1
  add column if not exists unsuitable_reason text null,       -- 'age-rattle', … ; null = suitable
  add column if not exists dirty_on_play boolean null,
  add column if not exists is_capsule boolean null;

-- Rows are pushed with explicit ids, which do not move the id counter; bring it up to max(id)
-- so that rows added in the Table Editor without an id do not fail with a duplicate key.
select setval(pg_get_serial_sequence('public.monster_data_mart', 'id'), (select max(id) from public.monster_data_mart));

-- Let the Data API (PostgREST) see the new columns right away.
notify pgrst, 'reload schema';

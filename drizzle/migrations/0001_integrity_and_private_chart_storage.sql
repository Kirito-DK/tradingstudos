-- Extra safeguards for the private TradeStudy workspace.
-- Run this migration in the connected Supabase project's SQL editor if it has not been applied.

create or replace function public.validate_study_parent_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'lessons' then
    if not exists (select 1 from public.modules m where m.id = new.module_id and m.user_id = new.user_id) then
      raise exception 'The selected module does not belong to this user';
    end if;
  elsif tg_table_name = 'lesson_notes' then
    if not exists (select 1 from public.lessons l where l.id = new.lesson_id and l.user_id = new.user_id) then
      raise exception 'The selected lesson does not belong to this user';
    end if;
  elsif tg_table_name in ('doubts', 'review_logs') then
    if new.lesson_id is not null and not exists (
      select 1 from public.lessons l where l.id = new.lesson_id and l.user_id = new.user_id
    ) then
      raise exception 'The selected lesson does not belong to this user';
    end if;
  elsif tg_table_name = 'chart_entries' then
    if new.lesson_id is not null and not exists (
      select 1 from public.lessons l where l.id = new.lesson_id and l.user_id = new.user_id
    ) then
      raise exception 'The selected lesson does not belong to this user';
    end if;
    if new.module_id is not null and not exists (
      select 1 from public.modules m where m.id = new.module_id and m.user_id = new.user_id
    ) then
      raise exception 'The selected module does not belong to this user';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists lessons_validate_parent on public.lessons;
create trigger lessons_validate_parent before insert or update of module_id, user_id on public.lessons
for each row execute function public.validate_study_parent_ownership();
drop trigger if exists lesson_notes_validate_parent on public.lesson_notes;
create trigger lesson_notes_validate_parent before insert or update of lesson_id, user_id on public.lesson_notes
for each row execute function public.validate_study_parent_ownership();
drop trigger if exists doubts_validate_parent on public.doubts;
create trigger doubts_validate_parent before insert or update of lesson_id, user_id on public.doubts
for each row execute function public.validate_study_parent_ownership();
drop trigger if exists review_logs_validate_parent on public.review_logs;
create trigger review_logs_validate_parent before insert or update of lesson_id, user_id on public.review_logs
for each row execute function public.validate_study_parent_ownership();
drop trigger if exists chart_entries_validate_parent on public.chart_entries;
create trigger chart_entries_validate_parent before insert or update of lesson_id, module_id, user_id on public.chart_entries
for each row execute function public.validate_study_parent_ownership();

-- Private bucket for chart screenshots. Files are stored under a folder named with the user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chart-images', 'chart-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Users can read their chart images" on storage.objects;
create policy "Users can read their chart images" on storage.objects
for select to authenticated using (bucket_id = 'chart-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can upload their chart images" on storage.objects;
create policy "Users can upload their chart images" on storage.objects
for insert to authenticated with check (bucket_id = 'chart-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can update their chart images" on storage.objects;
create policy "Users can update their chart images" on storage.objects
for update to authenticated using (bucket_id = 'chart-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'chart-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete their chart images" on storage.objects;
create policy "Users can delete their chart images" on storage.objects
for delete to authenticated using (bucket_id = 'chart-images' and (storage.foldername(name))[1] = auth.uid()::text);

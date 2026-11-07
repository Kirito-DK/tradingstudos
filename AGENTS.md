<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Data access goes through the browser Supabase client with RLS scoped to `auth.uid() = user_id`; every private table has its own policies — security never relies on the UI alone.
- Public sign-up is disabled; the owner account is managed from Cloud → Users.
- All signed-in pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/auth`).
- Lesson notes autosave to the database; localStorage only holds an unsaved draft as a failure backup and is used only if newer than the server copy.
- YouTube embeds must pass `parseYouTubeId` (domain + 11-char id whitelist) and use the nocookie embed URL.
- Offline reading uses user-scoped IndexedDB query snapshots cleared on sign-out and a generateSW worker registered only on published non-preview origins; private API responses and YouTube media are never service-worker cached.
- Offline content is read-only and never queues database writes, preventing stale edits from overwriting online changes.
- Video download controls use only official source mechanisms; YouTube links show unavailability rather than extracting media streams.
- Leaf route metadata uses the browser-safe pageHead helper to keep page-specific titles and social descriptions consistent.

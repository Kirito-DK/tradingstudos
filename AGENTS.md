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
- Home-screen installation uses a manifest and local icons only, without app-shell service workers, because offline operation was not requested.
- Leaf route metadata uses the browser-safe pageHead helper to keep page-specific titles and social descriptions consistent.

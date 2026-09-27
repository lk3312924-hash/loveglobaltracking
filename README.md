# Container Arrival Tracker

A live single-page dashboard for tracking shipping containers.

## Live cloud sync

The application stores edits in Supabase so multiple browser sessions can share updates. The database must contain this table:

```sql
create table if not exists public.tracker_data (
  id bigint primary key,
  user_edits jsonb not null default '{}'::jsonb,
  user_adds jsonb not null default '[]'::jsonb,
  user_deletes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.tracker_data enable row level security;

create policy "tracker read" on public.tracker_data
  for select to anon using (true);

create policy "tracker write" on public.tracker_data
  for insert to anon with check (true);

create policy "tracker update" on public.tracker_data
  for update to anon using (true) with check (true);
```

For browser sync, load these scripts before the application script in `index.html`:

```html
<script src="supabase-config.js"></script>
<script src="cloud-sync.js"></script>
```

The bridge watches the tracker's local storage, saves changes to Supabase, loads cloud data on startup, and polls for updates every five seconds.

> Security note: the Supabase publishable key is safe to use in browser code only when Row Level Security policies are configured correctly. Do not expose a service-role key.

## Deployment

Deploy the repository with Netlify for the existing password-gate configuration, or enable GitHub Pages for the static dashboard.

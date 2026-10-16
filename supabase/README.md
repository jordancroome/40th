# forty-tassie database

The stage 2 pages (`/hike/`, `/hobart/`, `/admin/`) talk to the Supabase project
**forty-tassie** (ref `vmhzsgcnohhhsxskahvt`, Sydney region).

- Tables: `people`, `payments`, `tasks`, `config`, `secrets`.
  RLS is on with no policies, and the public key has no table grants, so
  nothing is readable or writable directly.
- All access goes through `security definer` RPC functions:
  - Guests: `forty_config`, `forty_me(token)`, `forty_save(token, p)`,
    `forty_register(p)` (Hobart-only self sign-up), `forty_roster(token)`.
  - Admin (every call checks the admin key against a bcrypt hash in `secrets`):
    `forty_admin_dump`, `forty_admin_person`, `forty_admin_payment`,
    `forty_admin_charge_all`, `forty_admin_task`, `forty_admin_config`,
    `forty_admin_delete`.
- Each person has a random `token`. Their personal link is
  `/hike/?k=<token>` or `/hobart/?k=<token>`.

The full schema lives in the project's migration history
(`supabase_migrations.schema_migrations`). The admin key is never committed.
To rotate it, run:

```sql
update secrets set hash = extensions.crypt('<new key>', extensions.gen_salt('bf')) where key = 'admin';
```

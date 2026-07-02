# Supabase

Artefatos do banco (migrations, seeds, config do CLI).

- `migrations/` — migrations SQL geradas pelo Supabase CLI.
- Após alterar o schema, regenerar os tipos em `types/database.ts`:

```sh
npx supabase gen types typescript --project-id <id> > types/database.ts
```

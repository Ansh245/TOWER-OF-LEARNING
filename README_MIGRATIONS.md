Migration & deploy notes

- A SQL migration was added at `migrations/168_add_password_hash.sql` to add the `password_hash` column to `users`.
- Use the npm script below to apply migrations locally (requires `DATABASE_URL` env var):

  ```powershell
  $env:DATABASE_URL = "postgres://..."
  npm run db:migrate
  ```

- Build & start production:
  ```powershell
  npm run build
  npm start
  ```

- CI: A GitHub Actions workflow `./github/workflows/migrate-and-build.yml` is included to run migrations and build on push to `main`/`master`. Set `DATABASE_URL` in repository secrets.

- Recommended next step: commit these changes and push to your repository so CI can run and other environments receive the migration.

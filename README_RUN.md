This repo includes simple commands to run the app locally on Windows.

Quick start (PowerShell):

- Start backend (production bundle):

```powershell
Set-Location 'e:\TOG\FirebaseStudentAuth'
$env:NODE_ENV='production'; node --trace-uncaught dist/index.cjs
```

- Start frontend dev server (Vite):

```powershell
Set-Location 'e:\TOG\FirebaseStudentAuth'
npx vite
```

- Start server (dev) only:

```powershell
Set-Location 'e:\TOG\FirebaseStudentAuth'
npx cross-env NODE_ENV=development tsx server/index.ts
```

- Start both (recommended on Windows):

```powershell
Set-Location 'e:\TOG\FirebaseStudentAuth'
npm run dev:gui
```

This runs Vite and the dev server in two separate PowerShell windows so logs don't collide.

Notes:
- If `npx cross-env` asks to install `cross-env`, allow it; it's used to set `NODE_ENV` consistently on Windows.
- If you prefer a single-terminal experience, run `npm run dev:server` and `npm run dev:client` in separate tabs.

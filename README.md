# 💸 Split v2 — Spese Condivise

Next.js 14 · Mantine 7 · Mongoose · NextAuth (Google OAuth)

## Architettura

```
src/app/
├── (auth)/login/        → pagina login pubblica
└── (app)/               → tutto protetto da requireSession()
    ├── layout.tsx        → AppShell Mantine con sidebar
    ├── dashboard/
    │   ├── page.tsx      → Server Component
    │   └── server.ts     → getDashboardData() — query Mongoose diretta
    ├── expenses/
    │   ├── page.tsx      → Server Component
    │   └── server.ts     → getExpenses(), createExpense(), markSplitSettled(), deleteExpense()
    └── groups/
        ├── page.tsx
        ├── server.ts     → getUserGroups(), createGroup(), addMemberByEmail()
        ├── new/page.tsx
        └── [groupId]/page.tsx
```

## Regola chiave

- **Nessuna API route per i dati** — tutto via server.ts (Server Actions o funzioni chiamate dai Server Components)
- **API solo per NextAuth** (`/api/auth/[...nextauth]`)
- `revalidatePath()` dopo ogni mutation per aggiornare la UI

## Setup

```bash
npm install
cp .env.local.example .env.local
# Compila le variabili, poi:
npm run dev
```

## Env richieste

```
MONGODB_URI=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Google OAuth

In Google Cloud Console → Credenziali → OAuth 2.0:
Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

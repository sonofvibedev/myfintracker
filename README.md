# MyFinTracker

Personal finance tracker: expenses, income, transfers, category budgets, envelopes, savings goals and analytics. Mobile-first web app with a bottom tab bar, built for day-to-day personal use. Base currency is the Belarusian ruble (BYN), with multi-currency operations converted at the National Bank rate on the transaction date.

## Why

Answer two questions reliably:

- **Where did the money go?** — category and period analytics, trends, comparisons with previous periods.
- **Where will the money go?** — envelope budgeting, limits with warnings, recurring payments, savings goals.

## Features

- Transactions: expense, income, transfer between accounts (amount, category, date, note, account)
- Accounts: cash, cards, savings, custom types, each with its own currency
- Categories with custom icons and colors, nesting supported
- Analytics: day / week / month / year, balance over time, category breakdown, income vs expense
- Budgets: per-category limits with progress rings and overspend warnings
- Envelopes: budgets with rollover — unspent money carries over to the next period
- Planning: recurring payments, upcoming charges, savings goals with progress
- Currencies: BYN base (changeable), operations in USD / EUR / RUB and others, daily rates from the National Bank of the Republic of Belarus
- Themes: several palettes plus light and dark mode
- Export and import: CSV and JSON

## Stack

| Layer | Choice |
| --- | --- |
| Build | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties for themes |
| Animation | Motion (formerly Framer Motion) |
| Charts | Recharts for analytics, hand-written SVG for rings and sparklines |
| Routing | React Router v7 |
| State | TanStack Query for server data, Zustand for UI state |
| Backend | Supabase — Postgres, Auth, Row Level Security |
| Forms | react-hook-form + zod |
| Tests | Vitest, Playwright |

Exchange rates come from the free NBRB API (`https://api.nbrb.by/exrates/rates`), refreshed daily by a Supabase edge function and stored in `exchange_rates`. Every transaction stores both its original amount and the base-currency amount computed at the time it happened, so historical figures never shift when rates change.

## Project layout

```
src/
  app/            router, providers, theme
  features/
    transactions/ list, add sheet, keypad
    accounts/
    categories/
    budgets/      envelopes, goals
    analytics/    charts, period picker
    planning/     recurring, upcoming
    settings/     palettes, currency, import/export
  shared/
    ui/           Button, Sheet, Ring, Bar, Card
    lib/          supabase, money, dates, fx
    hooks/
  styles/         tokens.css, themes.css
supabase/
  migrations/
  functions/fetch-rates/
design/           design concepts and interactive HTML prototypes
```

## Navigation

Bottom tab bar with five slots and a prominent quick-add button in the middle:

**Overview** · **Transactions** · **[ + ]** · **Budget** · **Analytics**

Settings live behind a gear icon in the Overview header.

## Design

Three concepts were prototyped before any code was written. The app uses a hybrid of all three:

| Prototype | Concept | What the app takes from it |
| --- | --- | --- |
| `design/variant-a-swift.html` | Minimal fast entry | Full-screen keypad behind the quick-add button |
| `design/variant-b-prism.html` | Analytical dashboard | Overall visual language, Overview and Analytics screens |
| `design/variant-c-envelope.html` | Envelope budgeting | Budget screen: envelopes, goals, upcoming payments |

Open any prototype directly in a browser, or serve the folder:

```bash
cd design && python -m http.server 5599
```

All animations respect `prefers-reduced-motion`. Layouts are tested down to 400px wide.

## Development

```bash
npm install
npm run dev        # dev server
npm run build      # production build
npm run test       # unit tests
npm run test:e2e   # Playwright
```

Copy `.env.example` to `.env` and fill in the Supabase project URL and publishable key.

## Money handling

Amounts are stored as `numeric(12,2)` in Postgres and handled as integer minor units in JavaScript. Floating-point arithmetic is never used for money. Account balances are derived from transactions through a view rather than stored in a column, so there is nothing to fall out of sync.

## Status

In development. See the issue tracker for the current plan.

## License

MIT

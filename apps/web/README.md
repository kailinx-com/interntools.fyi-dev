# apps/web

Next.js frontend for `interntools.fyi`.

## Stack

- Next.js App Router + TypeScript
- React 19
- Tailwind CSS v4 + shadcn/ui
- Recharts for calculator/planner charts

## Routes (current)

- `/` home
- `/calculator` paycheck calculator
- `/calculator/planner` budget planner
- `/housing` housing placeholder
- `/login` login
- `/privacy` privacy policy placeholder
- `/signup` signup
- `/terms` terms placeholder

## Getting started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Quality checks

Run before opening a PR:

```bash
pnpm lint
pnpm build
```

Both should pass.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production access control

Set `EXPENSE_TRACKER_AUTH_USER` and `EXPENSE_TRACKER_AUTH_PASSWORD` in the
deployment environment. The app uses HTTP Basic authentication for every page
and API route, and refuses to serve requests in production when either setting
is missing. Copy `.env.example` to configure local values if you also want to
exercise the production access boundary locally.

## Database migrations

Apply schema migrations with `npm run migrate`. The budget-uniqueness migration
keeps the newest row for any existing duplicate category/month combination.

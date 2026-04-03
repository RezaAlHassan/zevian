# Zevian — Claude Code Reference

## Git Branch Rules

| Branch | Environment | Database | Deploys To |
|--------|-------------|----------|------------|
| `dev`  | Development | Supabase dev project | Netlify dev URL |
| `main` | Production  | Supabase prod project | app.zevian.co |

**Never push directly to `main` without Reza confirming.**
**Always ask which branch to push to before running `git push`.**

## Before Every Push — Ask This

"You're on branch `[current branch]`. Should I push to `dev` or `main`?"

Wait for an explicit answer. If Reza says "push it" or "deploy it" without specifying a branch, ask which one before proceeding.

## Local Environment

- `.env.local` always points to the **dev** Supabase project
- Production env vars live in **Netlify dashboard only** — never in the codebase
- Never create or modify `.env.production` or `.env.production.local`

## Workflow

```bash
# Dev work (default)
git checkout dev
git push origin dev        # → Netlify dev deploy only

# Production fix
git checkout main
# make changes
git push origin main       # → triggers live deploy to app.zevian.co
git checkout dev           # always return to dev after
```

## Rules

- `main` is always production. Treat it as live.
- All new feature work starts on `dev`
- Only bug fixes and critical changes go to `main` directly
- After any push to `main`, switch back to `dev` immediately
- Never run schema reset scripts (`schema_reset.sql`) on the prod Supabase project

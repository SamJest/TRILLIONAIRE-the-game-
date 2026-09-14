# TRILLIONAIRE production operations

Production service: `trillionaire-web` on Railway.

## Current invariants

- Competitive build: `v0.095`
- Ruleset: `COMP-1.2`
- Season: `S01-W01`
- Seed: `MARS-RACE-ALPHA-002`
- SQLite lives on the persistent Railway volume mounted at `/data`.
- Public ranked runs are accepted only after server-side replay.

## Required backup policy before public promotion

Railway volume backups support SQLite and can be scheduled from the service **Backups** tab.

Recommended minimum for private beta / launch candidate:

- Daily backup enabled.
- Weekly backup enabled.
- Manual backup immediately before any ruleset, schema, migration, or season-management change.
- Never wipe the production volume as a cleanup method: wiping a Railway volume also deletes its backups.

Railway retention at time of writing:

- Daily: every 24 hours, retained 6 days.
- Weekly: every 7 days, retained 27 days.
- Monthly: every 30 days, retained 89 days.

A restore creates a replacement volume and stages the change before deployment. The previous volume remains in the project unmounted, which gives an additional rollback point. Validate `/health`, leaderboard reads, and one authenticated identity read before accepting a restored production volume.

## Pre-deploy checklist

1. CI syntax checks pass.
2. Game bundle preflight passes.
3. Deterministic gameplay changes have either not occurred, or the competitive ruleset has been deliberately bumped with deterministic QA.
4. Confirm the production `/data` volume remains attached.
5. For database/schema changes, take a manual Railway volume backup first.
6. Deploy from the intended `main` commit only.
7. Verify `/health`, `/`, `/leaderboard`, and `/api/v1/meta` after deployment.
8. Do not run full production `qa-server.mjs` unless test leaderboard pollution is explicitly acceptable.

## Incident recovery

If a release breaks presentation only, redeploy the last known-good Git commit.

If a release corrupts or loses SQLite state:

1. Stop making leaderboard writes if possible.
2. Railway service → Backups → select the last known-good snapshot → Restore.
3. Review the staged volume replacement.
4. Deploy the restore.
5. Verify `/health` and the three read-only leaderboard boards.
6. Keep the old volume until the restored state is verified.

## Leaderboard moderation

Handles are server-normalised and filtered before storage. If manual moderation becomes necessary, do not edit the live SQLite file casually while the server is writing. Add a controlled moderation/admin path or perform maintenance against a backup copy first.

## Public launch gate

Do not promote broadly until all of these are true:

- Apex domain and `www` behaviour are both deliberate.
- Daily backups are enabled.
- First-run comprehension has been tested with people who were not coached.
- Mobile layout survives common narrow Android widths.
- Leaderboard names cannot trivially contain abusive content.
- Social preview and favicon are intentional rather than browser defaults.
- Offline/server-failure messaging is understandable.

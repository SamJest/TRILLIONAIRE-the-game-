# Deployment checklist

## Recommended first public beta topology

One Node service serves both the HTML game and the API. Point `trillionairethegame.com` at that service.

## Environment

```text
HOST=0.0.0.0
DATA_DIR=/data
TRILLIONAIRE_BUILD=v0.095
TRILLIONAIRE_SEASON=S01-W01
TRILLIONAIRE_RULESET=COMP-1.2
TRILLIONAIRE_SEED=MARS-RACE-ALPHA-002
```

`PORT` should normally be supplied by the hosting platform.

## Persistent disk

Mount a persistent volume at `/data`. The SQLite database, WAL and related state live there.

## DNS

The exact DNS records depend on the hosting provider. After deployment, add the provider's requested apex-domain record for `trillionairethegame.com` and optionally redirect `www.trillionairethegame.com` to the apex domain.

Do not change DNS until the host gives the exact target record.

## Launch verification

Before sharing the public URL:

1. `GET /health` returns HTTP 200.
2. `GET /api/v1/meta` reports v0.095 / S01-W01 / COMP-1.2.
3. The game loads over HTTPS.
4. An anonymous identity is created.
5. A callsign can be changed.
6. A complete Seeded Challenge can be submitted.
7. Server replay accepts the genuine run.
8. A forged score is rejected.
9. All three leaderboard tabs return rows.
10. Restart/redeploy the service and confirm leaderboard rows persist.

## Before larger traffic

Move replay verification into worker threads/queueing, add database backups, callsign moderation/admin tools, season lifecycle automation and traffic/abuse monitoring.

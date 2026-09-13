# TRILLIONAIRE

TRILLIONAIRE is a browser-based Mars strategy game with an authoritative competitive Seeded Challenge.

## Current production candidate

- Game build: **v0.095**
- Competitive ruleset: **COMP-1.2**
- Season: **S01-W01**
- Seed: **MARS-RACE-ALPHA-002**
- Replay protocol: **TRILLIONAIRE-RUN-1**

## How the competitive board works

Ranked runs are not trusted from the browser. A submitted Seeded Challenge includes its strategic action log. The server starts the same deterministic seed in a fresh isolated Node VM, replays every action, independently recalculates the result and only stores the run when the replay matches the submitted result.

Current backend features:

- anonymous server-issued UUID + bearer-token identity
- editable public callsigns
- SQLite persistence in WAL mode
- Canonical Score, Fastest Mars and Capital Efficiency boards
- duplicate-run protection
- server-side deterministic replay verification
- private action logs / public summary records
- basic rate limiting
- Docker deployment

## Run locally

Requires Node.js 22+.

```bash
npm start
```

Open `http://127.0.0.1:8787`.

With the server running, run the full competitive QA in another terminal:

```bash
npm run qa
```

## Docker

```bash
docker build -t trillionaire .
docker run --rm -p 8787:8787 -v trillionaire-data:/data trillionaire
```

## Production deployment

The first public beta is designed to serve the game and API from the same origin:

- `https://trillionairethegame.com/` — game
- `https://trillionairethegame.com/api/v1/...` — competitive API

This avoids unnecessary CORS/auth complexity during launch.

### Persistent storage is mandatory

While the beta uses SQLite, `/data` must be mounted to persistent storage. Never deploy this service with an ephemeral `/data` directory or leaderboard/player records will disappear on a redeploy.

A `render.yaml` and `railway.toml` are included as deployment starting points. Render requires a paid instance for a persistent disk; Railway requires a volume mounted at `/data`.

## Public API

- `GET /health`
- `GET /api/v1/meta`
- `POST /api/v1/players/anonymous`
- `GET /api/v1/players/me`
- `PATCH /api/v1/players/me`
- `POST /api/v1/runs`
- `GET /api/v1/leaderboards/current?board=canonical|fastest|efficient`
- `GET /api/v1/runs/:id`

## Competitive integrity rule

Any change to deterministic game logic, seed behaviour, scoring, replay-relevant actions or victory conditions must advance the competitive ruleset and rerun the full deterministic QA before deployment.

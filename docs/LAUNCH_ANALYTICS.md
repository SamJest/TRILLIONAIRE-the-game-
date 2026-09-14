# TRILLIONAIRE launch analytics

The production launch layer records a deliberately small set of first-party, anonymous funnel events to the existing persistent SQLite volume.

## Privacy scope

- no email addresses or real names
- no browser fingerprinting
- no raw IP address stored by the analytics layer
- per-tab anonymous session identifier only
- metadata is allowlisted and length-limited server-side

## Funnel events

`page_view`, `engaged_30s`, `engaged_120s`, `mode_selected`, `game_started`, `first_game_action`, `first_run_briefing_dismissed`, `leaderboard_open`, `leaderboard_tab`, `run_submit_attempt`, `run_verified`, `run_rejected`, `share_click`, `play_again`.

## Reporting

Aggregate reporting is available only through the admin-token-protected endpoint:

`GET /api/v1/admin/analytics?days=7`

This returns visitors/sessions, event counts, daily sessions, UTM sources, mode mix and the core launch funnel.

The analytics gateway is presentation/infrastructure only. It does not modify v0.095 deterministic game logic or COMP-1.2 replay verification.

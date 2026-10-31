# Ugadaika

A small pickleball podium prediction game for a single active nine-player tournament. The site is hosted on ChatGPT Sites; code is mirrored to a public GitHub repository. Predictions and results are stored in the Site's D1 database.

## Setup

Set these secrets in the Site's environment settings (never commit them):

- `ADMIN_PASSWORD`: a strong password for the organizer panel.
- `KIMI_API_KEY`: Moonshot API key, needed only to recognize uploaded screenshots.
- `KIMI_MODEL` (optional): a Moonshot model accepting image input; defaults to `kimi-k2.5`.

After changing environment variables, redeploy if required by Sites. Open the organizer panel, sign in, import a public Reclub event URL, review the title, time and nine players, then publish. If link import fails, upload a participant screenshot or enter players manually. Avatar URLs can be entered manually.

When the event ends, upload a screenshot of the final standings or manually select the official ranks. Review the result before publishing; results cannot be edited. New events require final results for the previous one.

## Rules

Predictions close 20 minutes after the event's start, in Hanoi time. A browser can submit once; this is a convenience limit, not identity verification. Each correctly placed player scores 3 points, and any other player in the top-three ranks scores 1 point. Shared ranks are supported. Other people's predictions remain hidden until the deadline.

## Development

Node.js 22 is required. Install with the Sites dependency installer, then run `npm run build`, `npx tsc --noEmit`, and `node --test tests/*.test.mjs`. Local D1 migration instructions are in the Sites starter documentation. The site requires a D1 binding named `DB` and is deployed using the Sites workflow.

The Reclub importer relies on public page structure and may need maintenance if that structure changes. Check that your use of Reclub data and image recognition is authorized.

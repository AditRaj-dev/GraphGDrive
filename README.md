# Graph Drive

Interactive graph visualization of your Google Drive. Folders are inner nodes, files are leaves. Click a file to preview it on the right.

## Setup

1. Create a Google Cloud project, enable the **Google Drive API**, configure the OAuth consent screen, and create an **OAuth 2.0 Web client ID** with `http://localhost:5173` as an authorized JavaScript origin.
2. Copy `.env.example` to `.env.local` and paste the client ID.
3. `npm install`
4. `npm run dev` and open `http://localhost:5173`.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm test` — run unit tests
- `npm run test:watch` — watch mode

## Layouts

Hierarchical (dagre), radial (d3-hierarchy), force-directed (d3-force). Switch from the toolbar.

## Notes

- Read-only Drive access (`drive.readonly` scope).
- Files are loaded lazily as folders are expanded. **Expand all** walks the whole tree (slow on large drives).
- Google Docs/Sheets/Slides previews use Google's `/preview` iframe — you must be signed into Google in this browser session.

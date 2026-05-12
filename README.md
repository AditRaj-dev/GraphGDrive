<div align="center">

# Graph Drive

### A visual map for the Google Drive your team actually uses.

Graph Drive turns folders, files, shared drives, and media collections into an interactive graph so teams can explore Drive faster, preview work in context, and finally understand where everything lives.

</div>

---

## The Problem

Google Drive is where work lives, but at scale it becomes hard to read.

Folders get nested too deeply. Shared drives drift out of context. Media folders turn into endless grids. Important documents are easy to lose and hard to explain to someone new.

Graph Drive adds the missing visual layer: a connected, navigable map of your Drive.

## Why Teams Use It

| Need | How Graph Drive Helps |
| --- | --- |
| Find files faster | Browse Drive as a graph instead of opening folder after folder. |
| Review media in context | Preview images, videos, PDFs, Docs, Sheets, and Slides without losing your place. |
| Understand messy folders | Group loose files into clean collections by type. |
| Work across shared spaces | Explore My Drive, Shared with me, and shared drives from one interface. |
| Gather files quickly | Multi-select files and download them as a ZIP. |
| Keep large Drives usable | Lazy loading and batching keep big folders responsive. |

## What It Feels Like

Graph Drive is built for fast visual exploration.

- Click through folders and watch the graph unfold.
- Focus on one folder when you need a clean view.
- Expand a full subtree when you want the whole picture.
- Double-click grouped file collections to inspect related assets.
- Preview files in a side panel while keeping their graph location visible.
- Switch between hierarchical, radial, and force-directed layouts.
- Use dark mode for long review sessions.

## Core Features

| Area | Features |
| --- | --- |
| Navigation | Interactive graph canvas, minimap, zoom, pan, folder focus, subtree expansion |
| Drive coverage | My Drive, Shared with me, shared drives |
| Previews | Images, videos, PDFs, Google Docs, Sheets, Slides |
| Collections | Grouped media/file windows, draggable and resizable panels |
| Selection | Ctrl/Cmd-click multi-select, selected file counter, ZIP download |
| Performance | Lazy Drive loading, large-folder batching, thumbnail batching for big collections |
| Comfort | Dark mode, keyboard shortcuts, session restore |
| Access | Google Drive read-only scope |

## Built For

- Creative teams reviewing photo, video, and design assets.
- Agencies auditing or handing off client Drive structures.
- Operations teams finding SOPs, reports, and spreadsheets.
- Research teams navigating document libraries.
- Founders cleaning up company knowledge before onboarding.
- Anyone who has ever asked, "Where did we put that file?"

## Privacy And Access

Graph Drive requests the Google Drive `drive.readonly` scope.

It is designed for browsing, previewing, and downloading files you already have permission to access. It does not request write access to your Drive.

Access tokens are stored locally in the browser with a short expiry so the app can restore your session after refresh.

## Product Walkthrough

### Connect

Sign in with Google and authorize read-only Drive access.

### Explore

Your Drive appears as a graph. Folders expand as you open them, so large Drives stay manageable.

### Preview

Click a file to preview it in the side panel. For Google-native files, Graph Drive uses Google's preview experience.

### Collect

Grouped file nodes open into collection windows. These are useful for media-heavy folders and mixed project directories.

### Download

Select files with Ctrl-click or Cmd-click, then download the selected set as `selected-files.zip`.

## Thumbnail Behavior

Graph Drive balances speed with reliability:

- Collections with fewer than `50` items load thumbnails immediately.
- Collections with `50` or more items load thumbnails in batches.
- Clicking a thumbnail does not restart thumbnail loading.

This keeps small collections snappy while avoiding request floods in very large folders.

## Getting Started

### Requirements

- Node.js 18 or newer
- npm
- A Google Cloud project
- Google Drive API enabled
- A Google OAuth 2.0 Web client ID

### Google Setup

1. Create or open a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create an OAuth 2.0 Client ID with application type `Web application`.
5. Add this authorized JavaScript origin for local development:

```text
http://localhost:5173
```

Add production or preview origins if you deploy the app.

### Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your OAuth client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## How To Use It

| Action | Result |
| --- | --- |
| Click a folder | Expand or collapse it |
| Shift-click a folder | Focus the graph on that folder |
| Shift-Alt-click a folder | Focus and expand the full subtree |
| Click a file | Select and preview it |
| Double-click a collection | Open grouped files |
| Ctrl/Cmd-click files | Add or remove files from selection |
| Press `?` | Open keyboard shortcuts |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Run TypeScript checks and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Technology

| Layer | Tools |
| --- | --- |
| App | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Graph | React Flow, Dagre, D3 hierarchy, D3 force |
| Files | Google Drive API, Google Identity Services |
| Preview and export | PDF.js, JSZip |

## Notes

- Google Docs, Sheets, and Slides previews depend on Google's preview iframe and file permissions.
- Some Google-native files cannot be downloaded directly through the media endpoint and may need to be opened in Google Drive.
- Very large Drive trees can take time to expand because every folder must be fetched from the Drive API.
- Thumbnail availability depends on Google Drive and the browser's Google session.
- Production builds may show a Vite chunk-size warning; the build can still succeed.

---

<div align="center">

Graph Drive makes Google Drive easier to see, explain, and use.

</div>

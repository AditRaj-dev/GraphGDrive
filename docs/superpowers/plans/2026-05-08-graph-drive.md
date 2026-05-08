# Graph Drive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page web app that visualizes the signed-in user's Google Drive as an interactive graph (folders = inner nodes, files = leaves) with a side preview pane for images, video, PDF, and Google Docs/Sheets/Slides. Users can switch between hierarchical, radial, and force-directed layouts.

**Architecture:** Pure client-side React + Vite + TypeScript SPA. OAuth via Google Identity Services token client (no backend). Drive REST API drives a lazy-loaded tree held in Zustand. React Flow renders nodes; positions come from one of three pluggable layout engines (`dagre`, `d3-hierarchy`, `d3-force`). Selecting a leaf opens a side panel that dispatches to a media-type-specific previewer.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind v3, Zustand, @xyflow/react v12, @dagrejs/dagre, d3-hierarchy, d3-force, pdfjs-dist, Vitest.

---

## Project Layout

```
graph drive/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example
├── .env.local              # gitignored, holds VITE_GOOGLE_CLIENT_ID
├── .gitignore
├── README.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/drive.ts                file metadata + tree node types
│   ├── lib/
│   │   ├── mime.ts                   MIME → preview category
│   │   ├── tree.ts                   build/merge tree, expand/collapse helpers
│   │   ├── auth.ts                   GIS token client wrapper
│   │   └── drive.ts                  Drive REST client (list, get bytes)
│   ├── layouts/
│   │   ├── types.ts                  LayoutKind union, PositionedNode
│   │   ├── hierarchical.ts           dagre
│   │   ├── radial.ts                 d3-hierarchy
│   │   ├── force.ts                  d3-force
│   │   └── index.ts                  dispatcher: kind → fn
│   ├── store/useStore.ts             Zustand: auth token, tree, selection, layout
│   ├── hooks/useDriveTree.ts         loads root + expands folders on demand
│   ├── components/
│   │   ├── SignIn.tsx
│   │   ├── Toolbar.tsx               layout switcher, expand-all, sign-out
│   │   ├── GraphCanvas.tsx           React Flow wrapper
│   │   ├── nodes/
│   │   │   ├── FolderNode.tsx
│   │   │   └── FileNode.tsx
│   │   └── preview/
│   │       ├── PreviewPane.tsx       routes by category
│   │       ├── ImagePreview.tsx
│   │       ├── VideoPreview.tsx
│   │       ├── PdfPreview.tsx
│   │       └── GoogleDocPreview.tsx
└── tests/
    ├── mime.test.ts
    ├── tree.test.ts
    ├── drive.test.ts
    └── layouts/
        ├── hierarchical.test.ts
        ├── radial.test.ts
        └── force.test.ts
```

Each `src/lib` and `src/layouts` file is a pure module — testable without DOM. Components stay thin and pull behavior from stores/hooks.

---

## Prerequisites (one-time, manual, before Task 1)

The implementer must do this before any task runs.

1. Create a Google Cloud Console project: https://console.cloud.google.com/
2. Enable the **Google Drive API** for the project.
3. Configure the **OAuth consent screen** (External, add your email as a test user).
4. Create an **OAuth 2.0 Client ID** of type **Web application**.
   - Authorized JavaScript origins: `http://localhost:5173`
   - No redirect URI required (token client uses the popup/postMessage flow).
5. Copy the Client ID. It will be pasted into `.env.local` in Task 2.

---

## Task 1: Bootstrap project (Vite + TS + git)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`

- [ ] **Step 1: Scaffold Vite React-TS project**

Run from inside `D:\graph drive`:

```bash
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty… Remove existing files and continue?" → choose **Ignore files and continue**. (The `docs/` plan directory must survive.)

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Verify dev server boots**

```bash
npm run dev
```

Expected: server prints `Local: http://localhost:5173/`. Open the URL → see the default Vite + React page. Stop the server (Ctrl+C).

- [ ] **Step 4: Initialize git and add baseline ignore**

```bash
git init
```

Append to `.gitignore` (Vite's template already includes most of these; add only what's missing):

```
.env.local
.env.*.local
dist/
node_modules/
.vite/
```

- [ ] **Step 5: First commit**

```bash
git add -A
git commit -m "chore: bootstrap vite react-ts project"
```

---

## Task 2: Add Tailwind, Zustand, Vitest, and feature deps

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `.env.example`, `.env.local`
- Modify: `src/index.css`, `package.json` (scripts)

- [ ] **Step 1: Install runtime deps**

```bash
npm install zustand @xyflow/react @dagrejs/dagre d3-hierarchy d3-force pdfjs-dist
npm install -D @types/d3-hierarchy @types/d3-force
```

- [ ] **Step 2: Install Tailwind v3**

```bash
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`.

- [ ] **Step 3: Configure Tailwind content paths**

Replace `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 4: Wire Tailwind into the stylesheet**

Replace `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; margin: 0; }
body { font-family: ui-sans-serif, system-ui, sans-serif; }
```

- [ ] **Step 5: Install and configure Vitest**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add scripts to `package.json` under `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Add env files**

Create `.env.example`:

```
VITE_GOOGLE_CLIENT_ID=replace-with-your-oauth-client-id.apps.googleusercontent.com
```

Create `.env.local` (gitignored) with the real client ID from the prerequisites step.

- [ ] **Step 7: Replace boilerplate App with a placeholder**

Replace `src/App.tsx`:

```tsx
export default function App() {
  return (
    <div className="h-full flex items-center justify-center text-gray-700">
      Graph Drive — bootstrap OK
    </div>
  );
}
```

- [ ] **Step 8: Verify dev + tests run**

```bash
npm run dev
```

Expected: page shows "Graph Drive — bootstrap OK" with Tailwind centering it. Stop the server.

```bash
npm test
```

Expected: `No test files found` — that's fine (we add tests next).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: add tailwind, zustand, vitest, drive deps"
```

---

## Task 3: Drive types and MIME helper (TDD)

**Files:**
- Create: `src/types/drive.ts`, `src/lib/mime.ts`, `tests/mime.test.ts`

- [ ] **Step 1: Define types**

Create `src/types/drive.ts`:

```ts
export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  size?: string;
};

export type PreviewKind =
  | "folder"
  | "image"
  | "video"
  | "pdf"
  | "gdoc"
  | "gsheet"
  | "gslide"
  | "other";

export type TreeNode = {
  file: DriveFile;
  childIds: string[];
  loaded: boolean;
};
```

- [ ] **Step 2: Write the failing tests for `categorize`**

Create `tests/mime.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { categorize } from "../src/lib/mime";

describe("categorize", () => {
  it("classifies folders", () => {
    expect(categorize("application/vnd.google-apps.folder")).toBe("folder");
  });
  it("classifies images", () => {
    expect(categorize("image/png")).toBe("image");
    expect(categorize("image/jpeg")).toBe("image");
    expect(categorize("image/webp")).toBe("image");
  });
  it("classifies video", () => {
    expect(categorize("video/mp4")).toBe("video");
    expect(categorize("video/webm")).toBe("video");
  });
  it("classifies pdf", () => {
    expect(categorize("application/pdf")).toBe("pdf");
  });
  it("classifies google docs / sheets / slides", () => {
    expect(categorize("application/vnd.google-apps.document")).toBe("gdoc");
    expect(categorize("application/vnd.google-apps.spreadsheet")).toBe("gsheet");
    expect(categorize("application/vnd.google-apps.presentation")).toBe("gslide");
  });
  it("falls back to other", () => {
    expect(categorize("application/zip")).toBe("other");
  });
});
```

- [ ] **Step 3: Run tests — expect failure**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/lib/mime'`.

- [ ] **Step 4: Implement `categorize`**

Create `src/lib/mime.ts`:

```ts
import type { PreviewKind } from "../types/drive";

export function categorize(mimeType: string): PreviewKind {
  if (mimeType === "application/vnd.google-apps.folder") return "folder";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.google-apps.document") return "gdoc";
  if (mimeType === "application/vnd.google-apps.spreadsheet") return "gsheet";
  if (mimeType === "application/vnd.google-apps.presentation") return "gslide";
  return "other";
}

export function isFolder(mimeType: string): boolean {
  return categorize(mimeType) === "folder";
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npm test
```

Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add drive types and mime categorizer"
```

---

## Task 4: Tree builder helpers (TDD)

The tree is held as a flat `Record<id, TreeNode>` with edges via `childIds`. We need helpers to merge a fetched batch of children into the map.

**Files:**
- Create: `src/lib/tree.ts`, `tests/tree.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/tree.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mergeChildren, ROOT_ID } from "../src/lib/tree";
import type { DriveFile } from "../src/types/drive";

const f = (id: string, parent: string, mime = "image/png"): DriveFile => ({
  id, name: id, mimeType: mime, parents: [parent],
});

describe("mergeChildren", () => {
  it("inserts children of root and marks root loaded", () => {
    const out = mergeChildren({}, ROOT_ID, [f("a", ROOT_ID), f("b", ROOT_ID)]);
    expect(out[ROOT_ID].childIds).toEqual(["a", "b"]);
    expect(out[ROOT_ID].loaded).toBe(true);
    expect(out["a"].file.name).toBe("a");
  });

  it("preserves siblings when merging a new folder", () => {
    let map = mergeChildren({}, ROOT_ID, [
      f("folderA", ROOT_ID, "application/vnd.google-apps.folder"),
      f("folderB", ROOT_ID, "application/vnd.google-apps.folder"),
    ]);
    map = mergeChildren(map, "folderA", [f("a1", "folderA")]);
    expect(map[ROOT_ID].childIds).toEqual(["folderA", "folderB"]);
    expect(map["folderA"].childIds).toEqual(["a1"]);
    expect(map["folderA"].loaded).toBe(true);
    expect(map["folderB"].loaded).toBe(false);
  });

  it("is idempotent: merging the same children twice does not duplicate", () => {
    let map = mergeChildren({}, ROOT_ID, [f("a", ROOT_ID)]);
    map = mergeChildren(map, ROOT_ID, [f("a", ROOT_ID)]);
    expect(map[ROOT_ID].childIds).toEqual(["a"]);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement tree helpers**

Create `src/lib/tree.ts`:

```ts
import type { DriveFile, TreeNode } from "../types/drive";

export const ROOT_ID = "root";

export type TreeMap = Record<string, TreeNode>;

const rootNode = (): TreeNode => ({
  file: { id: ROOT_ID, name: "My Drive", mimeType: "application/vnd.google-apps.folder" },
  childIds: [],
  loaded: false,
});

export function mergeChildren(map: TreeMap, parentId: string, children: DriveFile[]): TreeMap {
  const next: TreeMap = { ...map };
  if (!next[parentId]) {
    next[parentId] = parentId === ROOT_ID
      ? rootNode()
      : { file: { id: parentId, name: parentId, mimeType: "application/vnd.google-apps.folder" }, childIds: [], loaded: false };
  }
  const existingIds = new Set(next[parentId].childIds);
  const newIds: string[] = [];
  for (const child of children) {
    if (!existingIds.has(child.id)) newIds.push(child.id);
    next[child.id] = next[child.id] ?? { file: child, childIds: [], loaded: false };
    next[child.id] = { ...next[child.id], file: child };
  }
  next[parentId] = {
    ...next[parentId],
    childIds: [...next[parentId].childIds, ...newIds],
    loaded: true,
  };
  return next;
}

export function descendants(map: TreeMap, id: string): string[] {
  const out: string[] = [];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    const node = map[cur];
    if (!node) continue;
    for (const c of node.childIds) {
      out.push(c);
      stack.push(c);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: tree tests + mime tests all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tree map merge helper"
```

---

## Task 5: Drive REST client (TDD with mocked fetch)

The client only needs three methods: `listChildren(parentId, pageToken?)`, `fetchBytes(fileId)`, and `embedUrl(file)` (synchronous URL builder for Google Docs).

**Files:**
- Create: `src/lib/drive.ts`, `tests/drive.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/drive.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDriveClient } from "../src/lib/drive";

describe("DriveClient.listChildren", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("calls files.list with the right query and bearer header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ files: [{ id: "x", name: "x", mimeType: "image/png" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createDriveClient(() => "TOKEN");
    const res = await client.listChildren("root");
    const url = fetchMock.mock.calls[0][0] as string;
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(url).toContain("files");
    expect(url).toContain("q=%27root%27+in+parents+and+trashed%3Dfalse");
    expect(url).toContain("fields=");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer TOKEN");
    expect(res.files[0].id).toBe("x");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 401, text: async () => "unauthorized",
    }));
    const client = createDriveClient(() => "TOKEN");
    await expect(client.listChildren("root")).rejects.toThrow(/401/);
  });
});

describe("DriveClient.embedUrl", () => {
  it("builds google docs preview url", () => {
    const client = createDriveClient(() => "");
    expect(client.embedUrl({
      id: "abc", name: "doc", mimeType: "application/vnd.google-apps.document",
    })).toBe("https://docs.google.com/document/d/abc/preview");
  });
  it("returns null for non-google types", () => {
    const client = createDriveClient(() => "");
    expect(client.embedUrl({
      id: "abc", name: "img", mimeType: "image/png",
    })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

Create `src/lib/drive.ts`:

```ts
import type { DriveFile } from "../types/drive";

const FIELDS = "nextPageToken,files(id,name,mimeType,parents,iconLink,thumbnailLink,modifiedTime,size)";
const BASE = "https://www.googleapis.com/drive/v3";

export type ListResult = { files: DriveFile[]; nextPageToken?: string };

export type DriveClient = {
  listChildren(parentId: string, pageToken?: string): Promise<ListResult>;
  fetchBytes(fileId: string): Promise<Blob>;
  embedUrl(file: DriveFile): string | null;
};

export function createDriveClient(getToken: () => string): DriveClient {
  const authHeaders = (): HeadersInit => ({ Authorization: `Bearer ${getToken()}` });

  return {
    async listChildren(parentId, pageToken) {
      const q = encodeURIComponent(`'${parentId}' in parents and trashed=false`);
      const params = new URLSearchParams({
        pageSize: "200",
        fields: FIELDS,
        orderBy: "folder,name",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const url = `${BASE}/files?q=${q}&${params}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
      return res.json();
    },

    async fetchBytes(fileId) {
      const url = `${BASE}/files/${fileId}?alt=media`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
      return res.blob();
    },

    embedUrl(file) {
      const map: Record<string, string> = {
        "application/vnd.google-apps.document": "document",
        "application/vnd.google-apps.spreadsheet": "spreadsheets",
        "application/vnd.google-apps.presentation": "presentation",
      };
      const segment = map[file.mimeType];
      return segment ? `https://docs.google.com/${segment}/d/${file.id}/preview` : null;
    },
  };
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add drive rest client (list, download, embed url)"
```

---

## Task 6: Layout engines (TDD each)

All three layouts share a signature: `(graph: { nodes, edges }) => PositionedNode[]`.

**Files:**
- Create: `src/layouts/types.ts`, `src/layouts/hierarchical.ts`, `src/layouts/radial.ts`, `src/layouts/force.ts`, `src/layouts/index.ts`, `tests/layouts/hierarchical.test.ts`, `tests/layouts/radial.test.ts`, `tests/layouts/force.test.ts`

- [ ] **Step 1: Define the layout interface**

Create `src/layouts/types.ts`:

```ts
export type LayoutKind = "hierarchical" | "radial" | "force";

export type LayoutNode = { id: string; parentId: string | null; isFolder: boolean };
export type PositionedNode = { id: string; x: number; y: number };

export type LayoutFn = (nodes: LayoutNode[]) => PositionedNode[];
```

- [ ] **Step 2: Write the failing test for hierarchical**

Create `tests/layouts/hierarchical.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hierarchical } from "../../src/layouts/hierarchical";

describe("hierarchical layout", () => {
  it("places root above its children", () => {
    const positions = hierarchical([
      { id: "r", parentId: null, isFolder: true },
      { id: "a", parentId: "r", isFolder: false },
      { id: "b", parentId: "r", isFolder: false },
    ]);
    const byId = Object.fromEntries(positions.map(p => [p.id, p]));
    expect(byId.r.y).toBeLessThan(byId.a.y);
    expect(byId.r.y).toBeLessThan(byId.b.y);
    expect(byId.a.x).not.toBe(byId.b.x);
  });
});
```

- [ ] **Step 3: Run — expect failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 4: Implement hierarchical**

Create `src/layouts/hierarchical.ts`:

```ts
import dagre from "@dagrejs/dagre";
import type { LayoutFn } from "./types";

const NODE_W = 180;
const NODE_H = 56;

export const hierarchical: LayoutFn = (nodes) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 64 });
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const n of nodes) if (n.parentId) g.setEdge(n.parentId, n.id);
  dagre.layout(g);
  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return { id: n.id, x: x - NODE_W / 2, y: y - NODE_H / 2 };
  });
};
```

- [ ] **Step 5: Write the failing test for radial**

Create `tests/layouts/radial.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { radial } from "../../src/layouts/radial";

describe("radial layout", () => {
  it("places the root near the origin and children at radius > 0", () => {
    const pos = radial([
      { id: "r", parentId: null, isFolder: true },
      { id: "a", parentId: "r", isFolder: false },
      { id: "b", parentId: "r", isFolder: false },
    ]);
    const byId = Object.fromEntries(pos.map(p => [p.id, p]));
    const dist = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);
    expect(dist(byId.r)).toBeLessThan(1);
    expect(dist(byId.a)).toBeGreaterThan(50);
    expect(dist(byId.b)).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 6: Run — expect failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 7: Implement radial**

Create `src/layouts/radial.ts`:

```ts
import { stratify, tree as d3tree } from "d3-hierarchy";
import type { LayoutFn } from "./types";

const RADIUS_PER_DEPTH = 180;

export const radial: LayoutFn = (nodes) => {
  if (nodes.length === 0) return [];
  const root = stratify<{ id: string; parentId: string | null }>()
    .id((d) => d.id)
    .parentId((d) => d.parentId)(nodes);
  const maxDepth = Math.max(1, root.height);
  const layout = d3tree<{ id: string; parentId: string | null }>()
    .size([2 * Math.PI, maxDepth * RADIUS_PER_DEPTH])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(a.depth, 1));
  layout(root);
  return root.descendants().map((d) => ({
    id: d.data.id,
    x: (d as any).y * Math.cos((d as any).x - Math.PI / 2),
    y: (d as any).y * Math.sin((d as any).x - Math.PI / 2),
  }));
};
```

- [ ] **Step 8: Write the failing test for force**

Create `tests/layouts/force.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { force } from "../../src/layouts/force";

describe("force layout", () => {
  it("returns one position per node and separates connected nodes", () => {
    const pos = force([
      { id: "r", parentId: null, isFolder: true },
      { id: "a", parentId: "r", isFolder: false },
      { id: "b", parentId: "r", isFolder: false },
    ]);
    expect(pos).toHaveLength(3);
    const ids = new Set(pos.map(p => p.id));
    expect(ids).toEqual(new Set(["r", "a", "b"]));
    const byId = Object.fromEntries(pos.map(p => [p.id, p]));
    expect(Math.hypot(byId.a.x - byId.b.x, byId.a.y - byId.b.y)).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 9: Run — expect failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 10: Implement force**

Create `src/layouts/force.ts`:

```ts
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import type { LayoutFn } from "./types";

type Sim = { id: string; x?: number; y?: number };

export const force: LayoutFn = (nodes) => {
  const simNodes: Sim[] = nodes.map((n) => ({ id: n.id }));
  const links = nodes
    .filter((n) => n.parentId)
    .map((n) => ({ source: n.parentId as string, target: n.id }));
  const sim = forceSimulation(simNodes as any)
    .force("link", forceLink(links).id((d: any) => d.id).distance(80).strength(0.7))
    .force("charge", forceManyBody().strength(-200))
    .force("collide", forceCollide(40))
    .force("center", forceCenter(0, 0))
    .stop();
  for (let i = 0; i < 300; i++) sim.tick();
  return simNodes.map((n) => ({ id: n.id, x: n.x ?? 0, y: n.y ?? 0 }));
};
```

- [ ] **Step 11: Add the dispatcher**

Create `src/layouts/index.ts`:

```ts
import type { LayoutFn, LayoutKind } from "./types";
import { hierarchical } from "./hierarchical";
import { radial } from "./radial";
import { force } from "./force";

export const layouts: Record<LayoutKind, LayoutFn> = { hierarchical, radial, force };
export type { LayoutFn, LayoutKind, LayoutNode, PositionedNode } from "./types";
```

- [ ] **Step 12: Run all tests — expect pass**

```bash
npm test
```

Expected: hierarchical + radial + force layout tests all pass alongside earlier ones.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add hierarchical, radial, and force layout engines"
```

---

## Task 7: Auth (Google Identity Services)

Loads the GIS script lazily, requests a token via the OAuth2 token client, and exposes a Zustand-friendly observer.

**Files:**
- Create: `src/lib/auth.ts`
- Modify: `index.html` (preconnect)

- [ ] **Step 1: Add preconnect for the GIS host**

Edit `index.html` — inside `<head>`, add right after the existing `<link rel="icon" …>`:

```html
<link rel="preconnect" href="https://accounts.google.com" />
```

- [ ] **Step 2: Implement the auth module**

Create `src/lib/auth.ts`:

```ts
const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(cfg: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(opts?: { prompt?: string }): void };
          revoke(token: string, done: () => void): void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function requestAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) throw new Error("VITE_GOOGLE_CLIENT_ID is not set");
  await loadGis();
  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) reject(new Error(resp.error ?? "no token"));
        else resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

export async function revokeAccessToken(token: string): Promise<void> {
  await loadGis();
  return new Promise((resolve) => window.google!.accounts.oauth2.revoke(token, resolve));
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add google identity services token client"
```

---

## Task 8: Zustand store + tree-loading hook

**Files:**
- Create: `src/store/useStore.ts`, `src/hooks/useDriveTree.ts`

- [ ] **Step 1: Create the store**

Create `src/store/useStore.ts`:

```ts
import { create } from "zustand";
import type { TreeMap } from "../lib/tree";
import { ROOT_ID } from "../lib/tree";
import type { LayoutKind } from "../layouts/types";

type State = {
  token: string | null;
  tree: TreeMap;
  selectedId: string | null;
  layout: LayoutKind;
  expanded: Set<string>;
  setToken(token: string | null): void;
  setTree(tree: TreeMap): void;
  select(id: string | null): void;
  setLayout(layout: LayoutKind): void;
  toggleExpand(id: string): void;
  expand(id: string): void;
  reset(): void;
};

export const useStore = create<State>((set) => ({
  token: null,
  tree: {},
  selectedId: null,
  layout: "hierarchical",
  expanded: new Set([ROOT_ID]),
  setToken: (token) => set({ token }),
  setTree: (tree) => set({ tree }),
  select: (id) => set({ selectedId: id }),
  setLayout: (layout) => set({ layout }),
  toggleExpand: (id) => set((s) => {
    const next = new Set(s.expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    return { expanded: next };
  }),
  expand: (id) => set((s) => {
    const next = new Set(s.expanded);
    next.add(id);
    return { expanded: next };
  }),
  reset: () => set({ token: null, tree: {}, selectedId: null, expanded: new Set([ROOT_ID]) }),
}));
```

- [ ] **Step 2: Create the tree loader hook**

Create `src/hooks/useDriveTree.ts`:

```ts
import { useCallback, useMemo } from "react";
import { createDriveClient } from "../lib/drive";
import { mergeChildren, ROOT_ID } from "../lib/tree";
import { useStore } from "../store/useStore";

export function useDriveTree() {
  const token = useStore((s) => s.token);
  const tree = useStore((s) => s.tree);
  const setTree = useStore((s) => s.setTree);
  const expand = useStore((s) => s.expand);

  const client = useMemo(
    () => createDriveClient(() => token ?? ""),
    [token]
  );

  const loadChildren = useCallback(async (parentId: string) => {
    if (!token) return;
    let pageToken: string | undefined;
    let acc = useStore.getState().tree;
    do {
      const res = await client.listChildren(parentId, pageToken);
      acc = mergeChildren(acc, parentId, res.files);
      pageToken = res.nextPageToken;
    } while (pageToken);
    setTree(acc);
  }, [client, setTree, token]);

  const ensureRoot = useCallback(async () => {
    if (!useStore.getState().tree[ROOT_ID]?.loaded) await loadChildren(ROOT_ID);
  }, [loadChildren]);

  const expandAll = useCallback(async () => {
    if (!token) return;
    await ensureRoot();
    const queue: string[] = [...(useStore.getState().tree[ROOT_ID]?.childIds ?? [])];
    while (queue.length) {
      const id = queue.shift()!;
      const node = useStore.getState().tree[id];
      if (!node) continue;
      const isFolder = node.file.mimeType === "application/vnd.google-apps.folder";
      if (isFolder && !node.loaded) {
        await loadChildren(id);
        expand(id);
      }
      queue.push(...(useStore.getState().tree[id]?.childIds ?? []));
    }
  }, [ensureRoot, expand, loadChildren, token]);

  const visibleIds = useMemo(() => {
    const expanded = useStore.getState().expanded;
    if (!tree[ROOT_ID]) return [];
    const out: string[] = [ROOT_ID];
    const walk = (id: string) => {
      const node = tree[id];
      if (!node) return;
      const isFolder = node.file.mimeType === "application/vnd.google-apps.folder";
      if (isFolder && expanded.has(id)) {
        for (const c of node.childIds) {
          out.push(c);
          walk(c);
        }
      }
    };
    walk(ROOT_ID);
    return out;
  }, [tree]);

  return { ensureRoot, loadChildren, expandAll, visibleIds };
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add zustand store and drive tree hook"
```

---

## Task 9: App shell + sign-in screen

**Files:**
- Create: `src/components/SignIn.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Build the sign-in screen**

Create `src/components/SignIn.tsx`:

```tsx
import { useState } from "react";
import { requestAccessToken } from "../lib/auth";
import { useStore } from "../store/useStore";

export default function SignIn() {
  const setToken = useStore((s) => s.setToken);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    setError(null);
    setBusy(true);
    try {
      const token = await requestAccessToken();
      setToken(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Graph Drive</h1>
      <p className="text-gray-600 max-w-md text-center">
        Visualize your Google Drive as an interactive graph.
      </p>
      <button
        onClick={onSignIn}
        disabled={busy}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {busy ? "Connecting…" : "Sign in with Google"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Wire App to gate on auth**

Replace `src/App.tsx`:

```tsx
import { useEffect } from "react";
import SignIn from "./components/SignIn";
import { useStore } from "./store/useStore";
import { useDriveTree } from "./hooks/useDriveTree";

export default function App() {
  const token = useStore((s) => s.token);
  const { ensureRoot } = useDriveTree();

  useEffect(() => {
    if (token) ensureRoot();
  }, [token, ensureRoot]);

  if (!token) return <SignIn />;
  return (
    <div className="h-full flex items-center justify-center text-gray-700">
      Signed in. Graph coming next task.
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Open `http://localhost:5173`, click **Sign in with Google**, complete consent. Page should now show "Signed in. Graph coming next task." Check the browser DevTools network tab — there should be a successful `GET https://www.googleapis.com/drive/v3/files?…` request.

If you see `401` or `403`: re-check the OAuth client ID, that the Drive API is enabled, and that your email is added as a test user on the consent screen.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: gate app behind google sign-in and load root"
```

---

## Task 10: Graph canvas with React Flow + custom nodes

**Files:**
- Create: `src/components/nodes/FolderNode.tsx`, `src/components/nodes/FileNode.tsx`, `src/components/GraphCanvas.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Folder node component**

Create `src/components/nodes/FolderNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type FolderNodeData = { name: string; expanded: boolean; loaded: boolean };

export default function FolderNode({ data }: NodeProps<FolderNodeData>) {
  return (
    <div className="px-3 py-2 rounded-md bg-amber-100 border border-amber-300 text-sm shadow-sm min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />
      <div className="flex items-center gap-2">
        <span>{data.expanded ? "open" : "folder"}</span>
        <span className="truncate">{data.name}</span>
      </div>
      {!data.loaded && <div className="text-xs text-amber-700 mt-1">click to load</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500" />
    </div>
  );
}
```

- [ ] **Step 2: File node component**

Create `src/components/nodes/FileNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PreviewKind } from "../../types/drive";

export type FileNodeData = { name: string; kind: PreviewKind; selected: boolean };

const LABEL: Record<PreviewKind, string> = {
  folder: "folder", image: "image", video: "video", pdf: "pdf",
  gdoc: "doc", gsheet: "sheet", gslide: "slide", other: "file",
};

export default function FileNode({ data }: NodeProps<FileNodeData>) {
  return (
    <div className={[
      "px-3 py-2 rounded-md border text-sm shadow-sm min-w-[140px] bg-white",
      data.selected ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300",
    ].join(" ")}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase text-gray-500">{LABEL[data.kind]}</span>
        <span className="truncate">{data.name}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Graph canvas**

Create `src/components/GraphCanvas.tsx`:

```tsx
import { useCallback, useMemo } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FolderNode from "./nodes/FolderNode";
import FileNode from "./nodes/FileNode";
import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { ROOT_ID } from "../lib/tree";
import { layouts } from "../layouts";
import { categorize, isFolder as isFolderMime } from "../lib/mime";

const nodeTypes = { folder: FolderNode, file: FileNode };

export default function GraphCanvas() {
  const tree = useStore((s) => s.tree);
  const layoutKind = useStore((s) => s.layout);
  const expanded = useStore((s) => s.expanded);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const toggleExpand = useStore((s) => s.toggleExpand);
  const { loadChildren, visibleIds } = useDriveTree();

  const { nodes, edges } = useMemo(() => {
    const layoutNodes = visibleIds
      .map((id) => tree[id])
      .filter(Boolean)
      .map((n) => ({
        id: n.file.id,
        parentId: n.file.id === ROOT_ID ? null : n.file.parents?.[0] ?? null,
        isFolder: isFolderMime(n.file.mimeType),
      }));
    const positions = layouts[layoutKind](layoutNodes);
    const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));

    const nodes: Node[] = layoutNodes.map((ln) => {
      const node = tree[ln.id];
      const pos = posMap[ln.id] ?? { x: 0, y: 0 };
      if (ln.isFolder) {
        return {
          id: ln.id,
          type: "folder",
          position: { x: pos.x, y: pos.y },
          data: {
            name: node.file.name,
            expanded: expanded.has(ln.id),
            loaded: node.loaded,
          },
        };
      }
      return {
        id: ln.id,
        type: "file",
        position: { x: pos.x, y: pos.y },
        data: {
          name: node.file.name,
          kind: categorize(node.file.mimeType),
          selected: selectedId === ln.id,
        },
      };
    });
    const edges: Edge[] = layoutNodes
      .filter((n) => n.parentId)
      .map((n) => ({
        id: `${n.parentId}->${n.id}`,
        source: n.parentId as string,
        target: n.id,
      }));
    return { nodes, edges };
  }, [tree, visibleIds, layoutKind, expanded, selectedId]);

  const onNodeClick = useCallback(async (_: unknown, node: Node) => {
    const tn = useStore.getState().tree[node.id];
    if (!tn) return;
    if (isFolderMime(tn.file.mimeType)) {
      if (!tn.loaded) await loadChildren(tn.file.id);
      toggleExpand(tn.file.id);
    } else {
      select(tn.file.id);
    }
  }, [loadChildren, select, toggleExpand]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}
```

- [ ] **Step 4: Show the canvas in App**

Replace `src/App.tsx`:

```tsx
import { useEffect } from "react";
import SignIn from "./components/SignIn";
import GraphCanvas from "./components/GraphCanvas";
import { useStore } from "./store/useStore";
import { useDriveTree } from "./hooks/useDriveTree";

export default function App() {
  const token = useStore((s) => s.token);
  const { ensureRoot } = useDriveTree();

  useEffect(() => {
    if (token) ensureRoot();
  }, [token, ensureRoot]);

  if (!token) return <SignIn />;
  return (
    <div className="h-full grid grid-cols-[1fr_360px]">
      <div className="h-full">
        <GraphCanvas />
      </div>
      <aside className="h-full border-l border-gray-200 bg-gray-50 p-3 text-sm">
        Preview pane (next task)
      </aside>
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

Sign in. You should see your Drive root rendered as nodes in a hierarchical layout. Click a folder → its children load and appear; click again → it collapses. Click a file → its node gets a blue ring (preview not wired yet).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: render drive tree with react flow and custom nodes"
```

---

## Task 11: Toolbar (layout switcher + expand-all + sign-out)

**Files:**
- Create: `src/components/Toolbar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Build the toolbar**

Create `src/components/Toolbar.tsx`:

```tsx
import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { revokeAccessToken } from "../lib/auth";
import type { LayoutKind } from "../layouts/types";

const KINDS: { value: LayoutKind; label: string }[] = [
  { value: "hierarchical", label: "Hierarchical" },
  { value: "radial", label: "Radial" },
  { value: "force", label: "Force" },
];

export default function Toolbar() {
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);
  const token = useStore((s) => s.token);
  const reset = useStore((s) => s.reset);
  const { expandAll } = useDriveTree();

  async function onSignOut() {
    if (token) await revokeAccessToken(token);
    reset();
  }

  return (
    <div className="h-12 px-3 border-b border-gray-200 bg-white flex items-center gap-3 text-sm">
      <span className="font-semibold">Graph Drive</span>
      <div className="flex items-center gap-1 ml-4">
        {KINDS.map((k) => (
          <button
            key={k.value}
            onClick={() => setLayout(k.value)}
            className={[
              "px-2 py-1 rounded",
              layout === k.value ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200",
            ].join(" ")}
          >
            {k.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => expandAll()}
        className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
      >
        Expand all
      </button>
      <div className="ml-auto">
        <button
          onClick={onSignOut}
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add toolbar to the layout**

Replace `src/App.tsx`:

```tsx
import { useEffect } from "react";
import SignIn from "./components/SignIn";
import Toolbar from "./components/Toolbar";
import GraphCanvas from "./components/GraphCanvas";
import { useStore } from "./store/useStore";
import { useDriveTree } from "./hooks/useDriveTree";

export default function App() {
  const token = useStore((s) => s.token);
  const { ensureRoot } = useDriveTree();

  useEffect(() => {
    if (token) ensureRoot();
  }, [token, ensureRoot]);

  if (!token) return <SignIn />;
  return (
    <div className="h-full grid grid-rows-[3rem_1fr]">
      <Toolbar />
      <div className="h-full grid grid-cols-[1fr_360px] min-h-0">
        <div className="h-full min-h-0">
          <GraphCanvas />
        </div>
        <aside className="h-full border-l border-gray-200 bg-gray-50 p-3 text-sm overflow-auto min-h-0">
          Preview pane (next task)
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

After signing in: switching layout buttons re-positions the same nodes; **Expand all** walks the whole tree (slow on large drives — that's expected); **Sign out** returns you to the sign-in screen.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add toolbar with layout switcher and sign-out"
```

---

## Task 12: Preview pane — image, video, PDF, Google Docs

We fetch private bytes (image/video/PDF) with the Bearer token and render via blob URLs. Google Docs uses an iframe to `docs.google.com/.../preview`, which authenticates via the user's Google session cookie.

**Files:**
- Create: `src/components/preview/PreviewPane.tsx`, `src/components/preview/ImagePreview.tsx`, `src/components/preview/VideoPreview.tsx`, `src/components/preview/PdfPreview.tsx`, `src/components/preview/GoogleDocPreview.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Image preview**

Create `src/components/preview/ImagePreview.tsx`:

```tsx
import { useEffect, useState } from "react";
import { createDriveClient } from "../../lib/drive";
import { useStore } from "../../store/useStore";

export default function ImagePreview({ fileId, name }: { fileId: string; name: string }) {
  const token = useStore((s) => s.token);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const client = createDriveClient(() => token ?? "");
        const blob = await client.fetchBytes(fileId);
        url = URL.createObjectURL(blob);
        if (!cancelled) setSrc(url);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [fileId, token]);

  if (err) return <p className="text-red-600 text-sm">{err}</p>;
  if (!src) return <p className="text-gray-500 text-sm">Loading…</p>;
  return <img src={src} alt={name} className="max-w-full max-h-full object-contain mx-auto" />;
}
```

- [ ] **Step 2: Video preview**

Create `src/components/preview/VideoPreview.tsx`:

```tsx
import { useEffect, useState } from "react";
import { createDriveClient } from "../../lib/drive";
import { useStore } from "../../store/useStore";

export default function VideoPreview({ fileId }: { fileId: string }) {
  const token = useStore((s) => s.token);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const client = createDriveClient(() => token ?? "");
        const blob = await client.fetchBytes(fileId);
        url = URL.createObjectURL(blob);
        if (!cancelled) setSrc(url);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [fileId, token]);

  if (err) return <p className="text-red-600 text-sm">{err}</p>;
  if (!src) return <p className="text-gray-500 text-sm">Loading…</p>;
  return <video src={src} controls className="max-w-full max-h-full mx-auto" />;
}
```

- [ ] **Step 3: PDF preview (pdf.js)**

Create `src/components/preview/PdfPreview.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createDriveClient } from "../../lib/drive";
import { useStore } from "../../store/useStore";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfPreview({ fileId }: { fileId: string }) {
  const token = useStore((s) => s.token);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = createDriveClient(() => token ?? "");
        const blob = await client.fetchBytes(fileId);
        const buf = await blob.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled || !containerRef.current) return;
        containerRef.current.replaceChildren();
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "block mb-2 mx-auto shadow";
          const ctx = canvas.getContext("2d")!;
          containerRef.current.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [fileId, token]);

  if (err) return <p className="text-red-600 text-sm">{err}</p>;
  return <div ref={containerRef} className="h-full overflow-auto" />;
}
```

- [ ] **Step 4: Google Doc/Sheet/Slide preview**

Create `src/components/preview/GoogleDocPreview.tsx`:

```tsx
import { createDriveClient } from "../../lib/drive";
import type { DriveFile } from "../../types/drive";

export default function GoogleDocPreview({ file }: { file: DriveFile }) {
  const client = createDriveClient(() => "");
  const url = client.embedUrl(file);
  if (!url) return <p className="text-gray-500 text-sm">No preview available.</p>;
  return (
    <iframe
      src={url}
      title={file.name}
      className="w-full h-full border-0"
      allow="autoplay"
    />
  );
}
```

Note: the iframe loads via the user's Google session cookie. If the preview shows a sign-in screen, the user must be signed into the same Google account in this browser (the OAuth they did is separate).

- [ ] **Step 5: Preview pane router**

Create `src/components/preview/PreviewPane.tsx`:

```tsx
import { useStore } from "../../store/useStore";
import { categorize } from "../../lib/mime";
import ImagePreview from "./ImagePreview";
import VideoPreview from "./VideoPreview";
import PdfPreview from "./PdfPreview";
import GoogleDocPreview from "./GoogleDocPreview";

export default function PreviewPane() {
  const selectedId = useStore((s) => s.selectedId);
  const tree = useStore((s) => s.tree);
  const node = selectedId ? tree[selectedId] : null;

  if (!node) {
    return <p className="text-gray-500 text-sm">Select a file to preview.</p>;
  }
  const file = node.file;
  const kind = categorize(file.mimeType);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="mb-2">
        <div className="font-medium truncate">{file.name}</div>
        <div className="text-xs text-gray-500">{file.mimeType}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {kind === "image" && <ImagePreview fileId={file.id} name={file.name} />}
        {kind === "video" && <VideoPreview fileId={file.id} />}
        {kind === "pdf" && <PdfPreview fileId={file.id} />}
        {(kind === "gdoc" || kind === "gsheet" || kind === "gslide") && <GoogleDocPreview file={file} />}
        {kind === "other" && <p className="text-gray-500 text-sm">No preview for {file.mimeType}.</p>}
        {kind === "folder" && <p className="text-gray-500 text-sm">Folders don't have a preview.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Wire preview pane into App**

Replace `src/App.tsx`:

```tsx
import { useEffect } from "react";
import SignIn from "./components/SignIn";
import Toolbar from "./components/Toolbar";
import GraphCanvas from "./components/GraphCanvas";
import PreviewPane from "./components/preview/PreviewPane";
import { useStore } from "./store/useStore";
import { useDriveTree } from "./hooks/useDriveTree";

export default function App() {
  const token = useStore((s) => s.token);
  const { ensureRoot } = useDriveTree();

  useEffect(() => {
    if (token) ensureRoot();
  }, [token, ensureRoot]);

  if (!token) return <SignIn />;
  return (
    <div className="h-full grid grid-rows-[3rem_1fr]">
      <Toolbar />
      <div className="h-full grid grid-cols-[1fr_400px] min-h-0">
        <div className="h-full min-h-0">
          <GraphCanvas />
        </div>
        <aside className="h-full min-h-0 border-l border-gray-200 bg-gray-50 p-3 text-sm">
          <PreviewPane />
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Manual verification**

```bash
npm run dev
```

For each file type in your Drive, click a leaf and confirm the right pane:
- An image renders inline.
- A short video plays (large videos may take a while — they download fully via blob).
- A PDF renders all pages stacked.
- A Google Doc/Sheet/Slide opens in the iframe.

If a Google Doc iframe shows a Google sign-in: open `https://docs.google.com` in another tab in the same browser, sign in, then reload the app.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add preview pane for image, video, pdf, google docs"
```

---

## Task 13: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

Create `README.md`:

```markdown
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
```

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "docs: add readme"
```

---

## End-to-End Verification

After all tasks: a fresh clone of the repo plus `.env.local` should:

1. `npm install && npm test` — all unit tests pass (mime, tree, drive, three layouts).
2. `npm run dev` → `http://localhost:5173` shows the sign-in screen.
3. Sign in with a Google test user → Drive root appears as a hierarchical graph.
4. Click any folder node → it loads and expands (or collapses on a second click).
5. Toolbar layout buttons re-position the same nodes.
6. **Expand all** walks the entire tree.
7. Click an image / video / PDF / Google Doc leaf → the matching previewer renders in the right pane.
8. **Sign out** revokes the token and returns to the sign-in screen.

## Risks & Gotchas

- **OAuth client config.** The token client requires `http://localhost:5173` as an authorized JavaScript origin. Adding it requires propagation time (a few minutes). 401/403 from the Drive API almost always traces back to this or to the user not being added as a test user on the consent screen.
- **CORS on `alt=media`.** Google's CDN allows it for authenticated requests; the Bearer header is required. Don't try to use `webContentLink` directly — it redirects through cookie-authed hosts that won't accept Bearer tokens.
- **Video memory.** Streaming via blob URLs holds the whole file in memory. Acceptable for casual viewing; large 4K videos will be slow. A future improvement could use the `Range` header against `alt=media` to do progressive playback, but that's out of scope here.
- **Drive API quota.** Default is 1B queries/day per project, 1000 queries / 100s / user. The lazy-load strategy keeps queries proportional to user navigation. Expand-all on a 10k-file drive is fine but visible.
- **Token expiry.** GIS access tokens last ~1 hour. This plan doesn't add silent re-auth — when calls start failing with 401, the user must sign out and back in. If this becomes a real problem, add a 401 → `requestAccessToken({ prompt: "" })` retry.
- **`.env.local` must not be committed.** Confirmed in `.gitignore` in Task 1.
- **`pdfjs-dist` worker import.** Vite's `?url` suffix lets us load the worker as a module-relative URL. If the build fails on the worker import, ensure `pdfjs-dist` is at v4+.
- **Large trees + force layout.** `d3-force` at >1k nodes will be sluggish. Hierarchical/radial scale better. The toolbar warns nothing about this — acceptable trade-off for v1.

---

## Self-Review Checklist (run before handing off)

- [x] Every spec requirement (graph viz, multi-layout, preview pane, all 4 preview types, real Drive OAuth, React+Vite) maps to a task.
- [x] No "TBD"/"add error handling"/"similar to" placeholders — every code-bearing step has full code.
- [x] Type names referenced consistently: `DriveFile`, `TreeNode`, `TreeMap`, `LayoutKind`, `LayoutFn`, `LayoutNode`, `PositionedNode`, `PreviewKind`.
- [x] Function names consistent: `createDriveClient`, `mergeChildren`, `categorize`, `requestAccessToken`, `revokeAccessToken`, `useDriveTree`, `ensureRoot`, `loadChildren`, `expandAll`, `visibleIds`.
- [x] All env vars referenced (`VITE_GOOGLE_CLIENT_ID`) are documented in `.env.example` and the README.

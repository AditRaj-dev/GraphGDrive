import { useCallback, useState } from "react";
import { useStore } from "../../store/useStore";
import { useDriveTree } from "../../hooks/useDriveTree";
import { categorize } from "../../lib/mime";
import MediaGrid from "./MediaGrid";
import ImagePreview from "./ImagePreview";
import VideoPreview from "./VideoPreview";
import PdfPreview from "./PdfPreview";
import GoogleDocPreview from "./GoogleDocPreview";
import type { PreviewKind } from "../../types/drive";
import { driveOpenUrl } from "../../lib/drive";

const MIN_H = 72;

// ── Drag handle between sections ──────────────────────────────────────────────
function DragHandle({ onDelta }: { onDelta: (d: number) => void }) {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    let last = e.clientY;
    const move = (ev: MouseEvent) => { onDelta(ev.clientY - last); last = ev.clientY; };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [onDelta]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="h-2 shrink-0 flex items-center justify-center cursor-row-resize group select-none bg-stone-50 dark:bg-stone-800 border-y border-stone-100 dark:border-stone-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
    >
      <div className="w-8 h-0.5 rounded-full bg-stone-300 dark:bg-stone-600 group-hover:bg-blue-400 transition-colors" />
    </div>
  );
}

// ── Collapsible section header ─────────────────────────────────────────────────
function SectionHeader({ title, count, collapsed, onToggle }: {
  title: string; count: number; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700 shrink-0 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
    >
      <svg
        className={`w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="2,4 6,8 10,4" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{title}</span>
      <span className="ml-auto text-[10px] tabular-nums text-stone-400 dark:text-stone-500">{count}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PreviewPane() {
  const tree = useStore((s) => s.tree);
  const selectedId = useStore((s) => s.selectedId);
  const { visibleIds } = useDriveTree();

  // Categorise visible non-sentinel nodes
  const imageIds = visibleIds.filter(
    (id) => !id.startsWith("__") && tree[id] && categorize(tree[id].file.mimeType) === "image"
  );
  const videoIds = visibleIds.filter(
    (id) => !id.startsWith("__") && tree[id] && categorize(tree[id].file.mimeType) === "video"
  );

  const [photoH, setPhotoH] = useState(180);
  const [videoH, setVideoH] = useState(180);
  const [photosOpen, setPhotosOpen] = useState(true);
  const [videosOpen, setVideosOpen] = useState(true);

  const hasPhotos = imageIds.length > 0;
  const hasVideos = videoIds.length > 0;
  const hasMedia = hasPhotos || hasVideos;

  const selectedNode = selectedId ? tree[selectedId] : null;
  const selectedFile = selectedNode?.file ?? null;
  const selectedKind: PreviewKind | null = selectedFile ? categorize(selectedFile.mimeType) : null;
  const isDoc = selectedKind === "gdoc" || selectedKind === "gsheet" || selectedKind === "gslide";

  // Which handle controls which section height
  const onPhotosVideosHandle = useCallback((d: number) => {
    setPhotoH((h) => Math.max(MIN_H, h + d));
  }, []);

  const onMediaPreviewHandle = useCallback((d: number) => {
    if (hasVideos && videosOpen) setVideoH((h) => Math.max(MIN_H, h + d));
    else setPhotoH((h) => Math.max(MIN_H, h + d));
  }, [hasVideos, videosOpen]);

  const photosExpanded = hasPhotos && photosOpen;
  const videosExpanded = hasVideos && videosOpen;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">

      {/* ── Photos section ── */}
      {hasPhotos && (
        <>
          <SectionHeader
            title="Photos"
            count={imageIds.length}
            collapsed={!photosOpen}
            onToggle={() => setPhotosOpen((o) => !o)}
          />
          {photosExpanded && (
            <div className="shrink-0 overflow-auto" style={{ height: photoH }}>
              <MediaGrid nodeIds={imageIds} kind="image" />
            </div>
          )}
        </>
      )}

      {/* drag between photos and videos */}
      {photosExpanded && videosExpanded && (
        <DragHandle onDelta={onPhotosVideosHandle} />
      )}

      {/* ── Videos section ── */}
      {hasVideos && (
        <>
          <SectionHeader
            title="Videos"
            count={videoIds.length}
            collapsed={!videosOpen}
            onToggle={() => setVideosOpen((o) => !o)}
          />
          {videosExpanded && (
            <div className="shrink-0 overflow-auto" style={{ height: videoH }}>
              <MediaGrid nodeIds={videoIds} kind="video" />
            </div>
          )}
        </>
      )}

      {/* drag between media and preview */}
      {(photosExpanded || videosExpanded) && selectedFile && (
        <DragHandle onDelta={onMediaPreviewHandle} />
      )}

      {/* ── Preview section (flex-1 = takes all remaining height) ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            {/* File name header */}
            <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-700 shrink-0 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-800 dark:text-stone-100 truncate text-xs">{selectedFile.name}</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">{selectedFile.mimeType}</p>
              </div>
              <a
                href={driveOpenUrl(selectedFile)}
                target="_blank"
                rel="noreferrer"
                title="Open in Google Drive"
                className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" />
                  <polyline points="8,1 12,1 12,5" />
                  <line x1="12" y1="1" x2="6" y2="7" />
                </svg>
              </a>
            </div>

            {/* Content — overflow-hidden for iframes (they scroll internally), overflow-auto for everything else */}
            <div className={`flex-1 min-h-0 ${isDoc ? "overflow-hidden" : "overflow-auto"}`}>
              {selectedKind === "image" && (
                <div className="p-2 h-full flex items-center justify-center">
                  <ImagePreview fileId={selectedFile.id} name={selectedFile.name} />
                </div>
              )}
              {selectedKind === "video" && (
                <div className="p-2 h-full flex items-center justify-center">
                  <VideoPreview fileId={selectedFile.id} />
                </div>
              )}
              {selectedKind === "pdf" && <PdfPreview fileId={selectedFile.id} />}
              {isDoc && <GoogleDocPreview file={selectedFile} />}
              {selectedKind === "other" && (
                <p className="p-4 text-stone-400 dark:text-stone-500 text-xs">No preview for this file type.</p>
              )}
              {selectedKind === "folder" && (
                <p className="p-4 text-stone-400 dark:text-stone-500 text-xs">Folders don't have a preview.</p>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-400 dark:text-stone-500 text-xs">
            {hasMedia ? "Click a thumbnail to preview" : "Select a file to preview"}
          </div>
        )}
      </div>
    </div>
  );
}

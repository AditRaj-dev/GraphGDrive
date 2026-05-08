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
    return (
      <div className="h-full flex items-center justify-center text-stone-400 text-xs">
        Select a file to preview
      </div>
    );
  }

  const file = node.file;
  const kind = categorize(file.mimeType);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-4 border-b border-stone-100 shrink-0">
        <div className="font-medium text-stone-800 truncate text-sm">{file.name}</div>
        <div className="text-xs text-stone-400 mt-0.5 truncate">{file.mimeType}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3">
        {kind === "image" && <ImagePreview fileId={file.id} name={file.name} />}
        {kind === "video" && <VideoPreview fileId={file.id} />}
        {kind === "pdf" && <PdfPreview fileId={file.id} />}
        {(kind === "gdoc" || kind === "gsheet" || kind === "gslide") && <GoogleDocPreview file={file} />}
        {kind === "other" && <p className="text-stone-400 text-xs">No preview for this file type.</p>}
        {kind === "folder" && <p className="text-stone-400 text-xs">Folders don't have a preview.</p>}
      </div>
    </div>
  );
}

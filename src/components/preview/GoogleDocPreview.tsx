import { useMemo } from "react";
import { createDriveClient } from "../../lib/drive";
import type { DriveFile } from "../../types/drive";

export default function GoogleDocPreview({ file }: { file: DriveFile }) {
  const client = useMemo(() => createDriveClient(() => ""), []);
  const url = client.embedUrl(file);
  if (!url) return <p className="text-stone-400 text-xs">No preview available.</p>;
  return (
    <iframe
      src={url}
      title={file.name}
      className="w-full h-full border-0"
      allow="autoplay"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

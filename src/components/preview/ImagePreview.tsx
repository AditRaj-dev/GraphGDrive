import { useEffect, useState } from "react";
import { createDriveClient } from "../../lib/drive";
import { useStore } from "../../store/useStore";

export default function ImagePreview({ fileId, name }: { fileId: string; name: string }) {
  const token = useStore((s) => s.token);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;
    setSrc(null);
    setErr(null);
    (async () => {
      try {
        const client = createDriveClient(() => token ?? "");
        const blob = await client.fetchBytes(fileId);
        createdUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setSrc(createdUrl);
        } else {
          URL.revokeObjectURL(createdUrl);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fileId, token]);

  if (err) return <p className="text-red-600 text-xs">{err}</p>;
  if (!src) return <p className="text-stone-400 text-xs animate-pulse">Loading image…</p>;
  return <img src={src} alt={name} className="max-w-full max-h-full object-contain mx-auto block" />;
}

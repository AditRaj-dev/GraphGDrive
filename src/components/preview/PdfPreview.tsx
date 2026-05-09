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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const client = createDriveClient(() => token ?? "");
        const blob = await client.fetchBytes(fileId);
        const buf = await blob.arrayBuffer();
        if (cancelled) return;
        pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled || !containerRef.current) return;
        containerRef.current.replaceChildren();
        const containerW = containerRef.current.clientWidth;
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          if (cancelled || !containerRef.current) return;
          const page = await pdfDoc.getPage(p);
          const naturalW = page.getViewport({ scale: 1 }).width;
          const scale = containerW > 0 ? containerW / naturalW : 1;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "block mb-3 mx-auto shadow-sm rounded";
          const ctx = canvas.getContext("2d")!;
          containerRef.current.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) return;
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      pdfDoc?.destroy();
    };
  }, [fileId, token]);

  return (
    <div className="p-2 w-full">
      {loading && <p className="text-stone-400 text-xs animate-pulse mb-2">Loading PDF…</p>}
      {err && <p className="text-red-600 text-xs">{err}</p>}
      <div ref={containerRef} />
    </div>
  );
}

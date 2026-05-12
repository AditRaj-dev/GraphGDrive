import JSZip from "jszip";

export async function downloadFilesAsZip(
  entries: { id: string; name: string }[],
  token: string,
  zipName = "files.zip"
): Promise<void> {
  const zip = new JSZip();

  await Promise.all(
    entries.map(async ({ id, name }) => {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`);
      const blob = await res.blob();
      zip.file(name, blob);
    })
  );

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

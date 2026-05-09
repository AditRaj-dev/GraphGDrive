import { useStore } from "../../store/useStore";

interface Props { nodeIds: string[]; kind: "image" | "video" }

export default function MediaGrid({ nodeIds, kind }: Props) {
  const tree = useStore((s) => s.tree);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);

  return (
    <div className="grid grid-cols-3 gap-1 p-1.5">
      {nodeIds.map((id) => {
        const node = tree[id];
        if (!node) return null;
        const thumb = node.file.thumbnailLink;
        const active = selectedId === id;
        return (
          <button
            key={id}
            onClick={() => select(id)}
            title={node.file.name}
            className={[
              "aspect-square rounded overflow-hidden bg-stone-100 relative group transition-all focus:outline-none",
              active
                ? "ring-2 ring-blue-500 ring-offset-1"
                : "hover:ring-2 hover:ring-stone-300 hover:ring-offset-1",
            ].join(" ")}
          >
            {thumb ? (
              <img
                src={thumb}
                alt={node.file.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${kind === "image" ? "bg-sky-50" : "bg-violet-50"}`}>
                {kind === "image" ? <ImgIcon /> : <VidIcon />}
              </div>
            )}
            {kind === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><polygon points="2,0 8,4 2,8" /></svg>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ImgIcon() {
  return (
    <svg className="w-5 h-5 text-sky-300" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  );
}

function VidIcon() {
  return (
    <svg className="w-5 h-5 text-violet-300" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
  );
}

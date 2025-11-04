type ChatFrameProps = {
  onClose: () => void;
};

export function ChatFrame({ onClose }: ChatFrameProps) {
  const isDev = import.meta.env.DEV;
  const chatUrl = isDev ? 'http://localhost:3000' : 'https://harry-ai.vercel.app/';

  return (
    <div className="relative h-[calc(100vh-6rem)] w-full max-w-4xl overflow-hidden rounded-lg border border-neutral-800/70 bg-neutral-950/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-neutral-800/70 bg-neutral-900/70 px-3 py-2 text-sm uppercase tracking-wide text-neutral-300">
        <span>harryAi</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
        >
          ✕ Close
        </button>
      </div>
      <iframe title="harryAi chat" src={chatUrl} className="h-[calc(100%-2.5rem)] w-full border-none" />
    </div>
  );
}


import React from 'react';

function ChatFrame({ onClose }: { onClose: () => void }) {
  const isDev = import.meta.env.DEV;
  const chatUrl = isDev ? 'http://localhost:3000' : 'https://harry-ai.vercel.app/';

  return (
    <div className="relative bg-gray-900 rounded-md w-full h-[calc(100vh-8rem)] max-h-[600px] overflow-hidden">
      <div className="flex justify-between items-center bg-gray-800 p-2 rounded-t-md">
        <div className="text-green-400 font-bold">harryAi</div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white px-2 py-1 rounded"
        >
          ✕ Close
        </button>
      </div>
      <iframe 
        src={chatUrl} 
        className="w-full h-[calc(100%-2.5rem)]" 
        title="harryAi"
      />
    </div>
  );
}

export default ChatFrame;
import React from 'react';

export default function VideoPlayer({ url }: { url: string }) {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <video controls className="w-full h-full rounded-2xl">
        <source src={url} type="video/mp4" />
      </video>
    </div>
  );
}
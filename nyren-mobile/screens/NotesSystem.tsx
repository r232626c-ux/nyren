import React from 'react';

export default function NotesSystem() {
  return (
    <div className="p-4 border border-white/10 rounded-xl bg-white/5">
      <h4 className="font-bold mb-3 text-cyan-500">My Notebook</h4>
      <textarea 
        className="w-full h-40 bg-transparent border-none focus:ring-0 text-slate-300 resize-none text-sm" 
        placeholder="Jot down key takeaways from this lesson..." />
    </div>
  );
}
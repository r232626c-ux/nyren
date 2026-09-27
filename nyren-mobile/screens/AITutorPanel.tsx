import React from 'react';
import { pillColors } from '../constants/theme';

interface AITutorContext {
  topic: string;
  difficulty: string;
  lessonId: string;
}

export default function AITutorPanel({ context }: { context: AITutorContext }) {
  const difficultyColor = pillColors[context.difficulty] || 'text-slate-400 bg-white/5';

  return (
    <div className="flex-1 p-6 flex flex-col h-full border-l border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-cyan-400">AI Tutor</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${difficultyColor}`}>
          {context.difficulty.toUpperCase()}
        </span>
      </div>
      <div className="flex-1 bg-white/5 rounded-xl p-4 mb-4 overflow-y-auto">
        <p className="text-sm text-slate-400">Ask me anything about {context.topic}...</p>
      </div>
      <input className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm" placeholder="Ask a question..." />
    </div>
  );
}
'use client';
import React, { useState } from 'react';
import VideoPlayer from '@/components/learn/VideoPlayer';
import AITutorPanel from '@/components/ai/AITutorPanel';
import NotesSystem from '@/components/learn/NotesSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LessonPage({ params }: { params: { id: string, lessonId: string } }) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#020617] text-slate-200">
      {/* LEFT & CENTER: Content Area */}
      <main className="flex-1 overflow-y-auto border-r border-white/5">
        <div className="max-w-5xl mx-auto p-8">
          {/* Video Section */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-black mb-8">
            <VideoPlayer url="https://storage.coli.ai/lectures/genomics-101.mp4" />
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger value="content">Lesson Content</TabsTrigger>
              <TabsTrigger value="lab">Interactive Lab</TabsTrigger>
              <TabsTrigger value="discussion">Community</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-8 space-y-6">
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                Advanced RNA-Seq Pipeline Analysis
              </h1>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-slate-400 leading-relaxed">
                  In this module, we explore the alignment of high-throughput sequencing reads 
                  to the reference genome using HISAT2 and StringTie...
                </p>
                <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 font-mono text-cyan-300">
                  <code>hisat2 -x genome_index -U reads.fastq -S output.sam</code>
                </div>
              </div>

              <div className="flex gap-4 py-8">
                <button className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all">
                  Mark Lesson Complete
                </button>
                <button 
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className="px-6 py-3 bg-white/5 border border-white/10 font-bold rounded-xl hover:bg-white/10 transition-all"
                >
                  {isNotesOpen ? 'Close Notes' : 'Open Notebook'}
                </button>
              </div>
            </TabsContent>
            
            <TabsContent value="lab">
              <div className="h-[600px] w-full bg-slate-900 rounded-2xl border border-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-mono animate-pulse">Initializing Virtual Lab: Sequence Aligner...</span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* RIGHT: AI Tutor Panel (Fixed) */}
      <aside className="w-[400px] flex flex-col bg-[#071226]/50 backdrop-blur-md">
        <AITutorPanel 
          context={{
            lessonId: params.lessonId,
            topic: "RNA-Seq Pipeline",
            difficulty: "Advanced"
          }} 
        />
      </aside>
    </div>
  );
}
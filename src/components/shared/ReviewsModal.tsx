"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, X, CheckCircle2, Maximize2 } from "lucide-react";
import { Task } from "../../types";
import { PIC_COLORS, TASK_STATES } from "../../constants";

interface ReviewsModalProps {
  forReviewAll: Task[];
  setShowForReview: (show: boolean) => void;
  setEnrichTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export function ReviewsModal({
  forReviewAll,
  setShowForReview,
  setEnrichTask,
  updateTask,
}: ReviewsModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setShowForReview(false)}
        className="absolute inset-0 bg-[#04154D]/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#0A0A0C] rounded-[3rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 flex flex-col overflow-hidden">
        <div className="bg-[#FF5B24] p-7 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3"><AlertCircle size={26} /> Pending Reviews</h2>
            <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-1">{forReviewAll.length} tasks require approval</p>
          </div>
          <button onClick={() => setShowForReview(false)} className="p-3 hover:bg-white/20 rounded-full transition-colors"><X size={22} /></button>
        </div>
        <div className="p-7 overflow-y-auto flex-1 no-scrollbar bg-[#FBFBFD] dark:bg-[#121214]">
          {forReviewAll.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-[#04154D] dark:text-white">
              <CheckCircle2 size={56} className="mb-4" />
              <p className="font-black text-lg uppercase tracking-widest">All clear!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {forReviewAll.map(task => (
                <div key={task.id} className="bg-white dark:bg-[#1A1A1D] p-5 rounded-[2rem] border border-[#04154D]/10 dark:border-white/10 flex flex-col hover:border-[#FF5B24]/40 transition-colors min-h-[180px]">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest border ${PIC_COLORS[task.pic]?.bg || ""} ${PIC_COLORS[task.pic]?.text || ""} ${PIC_COLORS[task.pic]?.border || ""}`}>
                      {task.pic}
                    </span>
                    <button onClick={() => { setShowForReview(false); setEnrichTask(task); }}
                      className="p-1.5 bg-[#FBFBFD] dark:bg-[#121214] rounded-lg text-[#04154D]/40 dark:text-white/40 hover:text-[#2A59FF] transition-colors">
                      <Maximize2 size={14} />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-[#04154D] dark:text-white mb-5 flex-1 leading-snug">{task.title}</h3>
                  <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })}
                    className="w-full font-bold px-4 py-2.5 rounded-xl border border-[#04154D]/10 dark:border-white/10 outline-none text-sm bg-[#FBFBFD] dark:bg-[#121214] text-[#04154D] dark:text-white cursor-pointer hover:border-[#2A59FF]/40 transition-colors">
                    {TASK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

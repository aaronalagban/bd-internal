"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import { Task } from "../../types";

interface DeferModalProps {
  deferTask: Task | null;
  deferDate: string;
  setDeferDate: (date: string) => void;
  setDeferTask: (task: Task | null) => void;
  handleDefer: () => void;
}

export function DeferModal({
  deferTask,
  deferDate,
  setDeferDate,
  setDeferTask,
  handleDefer,
}: DeferModalProps) {
  if (!deferTask) return null;
  const minDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => { setDeferTask(null); setDeferDate(""); }}
        className="absolute inset-0 bg-[#04154D]/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer" />
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 p-8 z-10 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#04154D] dark:text-white">Defer Task</h3>
          <button onClick={() => { setDeferTask(null); setDeferDate(""); }} className="p-2 rounded-full hover:bg-[#04154D]/5 dark:hover:bg-white/5 text-[#04154D]/40 dark:text-white/40"><X size={18} /></button>
        </div>
        <div className="bg-slate-500/5 border border-slate-500/10 rounded-2xl px-4 py-3">
          <p className="text-sm font-bold text-[#04154D] dark:text-white truncate">{deferTask.title}</p>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">Defer Until</label>
          <input type="date" min={minDate} value={deferDate} onChange={e => setDeferDate(e.target.value)}
            className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <p className="text-[9px] text-[#04154D]/30 dark:text-white/30 mt-2">The task will be hidden until this date.</p>
        </div>
        <button onClick={handleDefer} disabled={!deferDate}
          className="w-full bg-slate-600 text-white font-bold text-sm py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg disabled:opacity-40">
          <Clock size={18} /> Defer Task
        </button>
      </motion.div>
    </div>
  );
}

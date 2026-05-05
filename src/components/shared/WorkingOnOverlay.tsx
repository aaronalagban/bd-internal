"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, Square, Play, Clock } from "lucide-react";
import { format } from "date-fns";
import { Task, TimeBlock } from "../../types";
import { PIC_COLORS, STATUS_COLORS } from "../../constants";
import { slotLabel, timeToSlot } from "../../lib/utils";

interface WorkingOnOverlayProps {
  focusedMember: string | null;
  setFocusedMember: (member: string | null) => void;
  loggedInUser: string | null;
  tasks: Task[];
  workingOnTask: Record<string, string | null>;
  timeBlocks: Record<string, TimeBlock[]>;
  toggleWorkingOn: (member: string, taskId: string) => void;
}

export function WorkingOnOverlay({
  focusedMember,
  setFocusedMember,
  loggedInUser,
  tasks,
  workingOnTask,
  timeBlocks,
  toggleWorkingOn,
}: WorkingOnOverlayProps) {
  if (!focusedMember) return null;
  const colors = PIC_COLORS[focusedMember];
  const activeTaskId = workingOnTask[focusedMember];
  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;
  const memberTasks = tasks.filter(t =>
    t.pic === focusedMember && t.status !== "Done" && t.status !== "Deferred"
  );
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayBlocks = (timeBlocks[focusedMember] || []).filter(b => b.date === todayStr)
    .sort((a, b) => a.start > b.start ? 1 : -1);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setFocusedMember(null)}
        className="absolute inset-0 bg-[#04154D]/70 dark:bg-black/85 backdrop-blur-sm cursor-pointer" />
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 p-8 z-10 max-h-[90vh] overflow-y-auto no-scrollbar">

        <button onClick={() => setFocusedMember(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#04154D]/5 dark:hover:bg-white/5 text-[#04154D]/40 dark:text-white/40"><X size={16} /></button>

        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-2 mx-auto mb-4 ${colors.bg} ${colors.border} ${colors.text}`}>
          {focusedMember.charAt(0)}
        </div>
        <h2 className="text-center text-xl font-black text-[#04154D] dark:text-white mb-1">{focusedMember}</h2>

        {activeTask ? (
          <div className={`mt-4 p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#2A59FF] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#2A59FF]">Currently Playing</span>
            </div>
            <p className={`text-sm font-bold ${colors.text}`}>{activeTask.title}</p>
            <p className="text-[9px] text-[#04154D]/30 dark:text-white/30 mt-1 uppercase tracking-widest">{activeTask.urgency || "Routine"} · {activeTask.status}</p>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-2xl border border-[#04154D]/8 dark:border-white/8 text-center">
            <p className="text-[11px] text-[#04154D]/30 dark:text-white/30 italic">Idle</p>
          </div>
        )}

        {focusedMember === loggedInUser && memberTasks.length > 0 && (
          <div className="mt-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#04154D]/30 dark:text-white/30 mb-2">Switch to…</p>
            <div className="space-y-1.5">
              {memberTasks.map(t => (
                <button key={t.id}
                  onClick={() => toggleWorkingOn(focusedMember, t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left
                    ${activeTaskId === t.id
                      ? `${colors.bg} ${colors.border} ring-1 ring-[#2A59FF]/40`
                      : "border-[#04154D]/8 dark:border-white/8 hover:border-[#2A59FF]/30"
                    }`}>
                  {activeTaskId === t.id
                    ? <Square size={12} className="text-[#2A59FF] shrink-0" fill="currentColor" />
                    : <Play size={12} className="text-[#04154D]/30 dark:text-white/30 shrink-0" />
                  }
                  <span className="text-[10px] font-bold text-[#04154D] dark:text-white truncate flex-1">{t.title}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLORS[t.status]?.bg} ${STATUS_COLORS[t.status]?.border} ${STATUS_COLORS[t.status]?.text}`}>{t.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {todayBlocks.length > 0 && (
          <div className="mt-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#04154D]/30 dark:text-white/30 mb-2">Today&apos;s Schedule</p>
            <div className="space-y-2">
              {todayBlocks.map(b => {
                const t = tasks.find(x => x.id === b.taskId);
                return t ? (
                  <div key={b.id} className="flex items-center gap-3 px-3 py-2 bg-[#FBFBFD] dark:bg-[#1A1A1D] rounded-xl border border-[#04154D]/5 dark:border-white/5">
                    <Clock size={11} className="text-[#04154D]/30 dark:text-white/30 shrink-0" />
                    <span className="text-[9px] font-bold text-[#04154D]/50 dark:text-white/50 shrink-0 tabular-nums">
                      {slotLabel(timeToSlot(b.start))} – {slotLabel(timeToSlot(b.end))}
                    </span>
                    <span className="text-[10px] font-semibold text-[#04154D] dark:text-white truncate">{t.title}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

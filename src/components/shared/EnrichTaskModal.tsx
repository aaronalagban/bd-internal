"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, AlertCircle, FileText, Link2, Trash2, Users } from "lucide-react";
import { format, addDays } from "date-fns";
import { Task } from "../../types";
import { PIC_COLORS, TEAM_MEMBERS, TASK_STATES } from "../../constants";
import { isOverdue } from "../../lib/utils";
import { RealTimeInput, NotesTextarea } from "../shared/Inputs";

interface EnrichTaskModalProps {
  enrichTask: Task | null;
  setEnrichTask: (task: Task | null) => void;
  loggedInUser: string | null;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setDeferTask: (task: Task | null) => void;
  setDeferDate: (date: string) => void;
}

export function EnrichTaskModal({
  enrichTask,
  setEnrichTask,
  loggedInUser,
  updateTask,
  deleteTask,
  setDeferTask,
  setDeferDate,
}: EnrichTaskModalProps) {
  if (!enrichTask) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setEnrichTask(null)}
        className="absolute inset-0 bg-[#04154D]/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer" />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        className="relative w-full max-w-xl h-full bg-white dark:bg-[#121214] border-l border-[#04154D]/10 dark:border-white/10 shadow-2xl flex flex-col z-10 overflow-hidden">

        <div className="flex items-center justify-between p-6 border-b border-[#04154D]/5 dark:border-white/5 bg-[#FBFBFD] dark:bg-[#1A1A1D] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${PIC_COLORS[enrichTask.pic]?.bg} ${PIC_COLORS[enrichTask.pic]?.border} ${PIC_COLORS[enrichTask.pic]?.text}`}>
              {enrichTask.pic.charAt(0)}
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40">Task Detail</p>
              <p className="text-xs font-bold text-[#04154D]/60 dark:text-white/60">{enrichTask.pic}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to delete this task?")) {
                  deleteTask(enrichTask.id);
                }
              }}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
              title="Delete Task"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={() => setEnrichTask(null)}
              className="p-2 bg-white dark:bg-[#121214] rounded-full hover:scale-110 transition-transform border border-[#04154D]/8 dark:border-white/8 text-[#04154D] dark:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-7 min-h-0">
          <RealTimeInput value={enrichTask.title} onSave={v => updateTask(enrichTask.id, { title: v })}
            className="w-full text-2xl font-black bg-transparent text-[#04154D] dark:text-white outline-none border-b-2 border-transparent focus:border-[#2A59FF]/40 transition-colors pb-2" />

          {isOverdue(enrichTask) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">This task is overdue. Update the dates or mark it done.</p>
            </div>
          )}

          {loggedInUser === "Michelle" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">Assign To</label>
              <select value={enrichTask.pic} onChange={e => updateTask(enrichTask.id, { pic: e.target.value })}
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer">
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 flex items-center gap-2 mb-3">
              <Users size={13} /> Tag Members
            </label>
            <div className="flex flex-wrap gap-2">
              {TEAM_MEMBERS.map(member => {
                const isTagged = enrichTask.tagged_members?.includes(member);
                const colors = PIC_COLORS[member];
                return (
                  <button
                    key={member}
                    onClick={() => {
                      const current = enrichTask.tagged_members || [];
                      const next = isTagged 
                        ? current.filter(m => m !== member)
                        : [...current, member];
                      updateTask(enrichTask.id, { tagged_members: next });
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all
                      ${isTagged 
                        ? `${colors.bg} ${colors.border} ${colors.text}` 
                        : "bg-transparent border-[#04154D]/10 dark:border-white/10 text-[#04154D]/40 dark:text-white/40 hover:border-[#2A59FF]/30"
                      }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isTagged ? colors.bar : "bg-slate-300"}`} />
                    {member}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">Status</label>
              <select value={enrichTask.status}
                onChange={e => {
                  if (e.target.value === "Deferred") {
                    setDeferTask(enrichTask);
                    setDeferDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
                    setEnrichTask(null);
                  } else {
                    updateTask(enrichTask.id, { status: e.target.value });
                  }
                }}
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer">
                {TASK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">Urgency</label>
              <select value={enrichTask.urgency || "Routine"} onChange={e => updateTask(enrichTask.id, { urgency: e.target.value as Task["urgency"] })}
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer">
                <option>Routine</option><option>Urgent</option><option>Scheduled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">Start Date</label>
              <input type="date" value={enrichTask.start_date || ""}
                onChange={e => updateTask(enrichTask.id, { start_date: e.target.value })}
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white rounded-xl px-4 py-3 text-sm font-bold border border-[#04154D]/10 dark:border-white/10 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">End Date</label>
              <input type="date" value={enrichTask.end_date || ""}
                onChange={e => updateTask(enrichTask.id, { end_date: e.target.value })}
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white rounded-xl px-4 py-3 text-sm font-bold border border-[#04154D]/10 dark:border-white/10 outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 flex items-center gap-2 mb-2">
              <FileText size={13} /> Notes
            </label>
            <NotesTextarea
              value={enrichTask.notes || ""}
              onSave={v => updateTask(enrichTask.id, { notes: v })}
              placeholder="Type detailed notes here..."
              className="w-full min-h-[140px] bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-2xl p-5 text-sm font-medium outline-none resize-y placeholder:text-[#04154D]/25 dark:placeholder:text-white/25"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 flex items-center gap-2 mb-2">
              <Link2 size={13} /> Reference Link
            </label>
            <RealTimeInput
              value={enrichTask.links || ""}
              onSave={v => updateTask(enrichTask.id, { links: v })}
              placeholder="https://..."
              className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#2A59FF] border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none placeholder:text-[#04154D]/25 dark:placeholder:text-white/25"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

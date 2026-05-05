"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, X, Plus, Users } from "lucide-react";
import { Task } from "../../types";
import { TEAM_MEMBERS, URGENCY_COLORS } from "../../constants";

interface QuickAddModalProps {
  newTask: Partial<Task>;
  setNewTask: (task: Partial<Task>) => void;
  loggedInUser: string | null;
  addTask: (e: React.FormEvent) => void;
  setShowQuickAdd: (show: boolean) => void;
}

export function QuickAddModal({
  newTask,
  setNewTask,
  loggedInUser,
  addTask,
  setShowQuickAdd,
}: QuickAddModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setShowQuickAdd(false)}
        className="absolute inset-0 bg-[#04154D]/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer" />
      <motion.form onSubmit={addTask}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 p-8 z-10 flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#04154D] dark:text-white flex items-center gap-2">
            <Zap size={20} className="text-[#2A59FF]" /> Quick Add Task
          </h3>
          <button type="button" onClick={() => setShowQuickAdd(false)}
            className="p-2 rounded-full hover:bg-[#04154D]/5 dark:hover:bg-white/5 text-[#04154D]/40 dark:text-white/40 transition-colors">
            <X size={18} />
          </button>
        </div>

        <input autoFocus required value={newTask.title}
          onChange={e => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="What needs to be done?"
          className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-2xl px-5 py-3.5 text-base font-semibold text-[#04154D] dark:text-white outline-none focus:border-[#2A59FF]/40 transition-colors placeholder:text-[#04154D]/30 dark:placeholder:text-white/30" />

        {loggedInUser === "Michelle" && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-1.5">Assign To</label>
            <select value={newTask.pic || loggedInUser} onChange={e => setNewTask({ ...newTask, pic: e.target.value })}
              className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white rounded-xl px-4 py-2.5 text-sm font-bold border border-[#04154D]/8 dark:border-white/8 outline-none cursor-pointer">
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-1.5">Start</label>
            <input type="date" value={newTask.start_date || ""}
              onChange={e => setNewTask({ ...newTask, start_date: e.target.value })}
              className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white rounded-xl px-3 py-2.5 text-sm font-bold border border-[#04154D]/8 dark:border-white/8 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-1.5">End</label>
            <input type="date" value={newTask.end_date || ""}
              onChange={e => setNewTask({ ...newTask, end_date: e.target.value })}
              className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white rounded-xl px-3 py-2.5 text-sm font-bold border border-[#04154D]/8 dark:border-white/8 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">Urgency</label>
          <div className="flex gap-2">
            {(["Urgent", "Routine", "Scheduled"] as const).map(u => (
              <button type="button" key={u} onClick={() => setNewTask({ ...newTask, urgency: u })}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${newTask.urgency === u
                  ? `${URGENCY_COLORS[u].bg} ${URGENCY_COLORS[u].text} border-transparent`
                  : "border-[#04154D]/10 dark:border-white/10 text-[#04154D]/50 dark:text-white/50 hover:bg-[#04154D]/5 dark:hover:bg-white/5"}`}>
                {u}
              </button>
            ))}
          </div>
        </div>

        <button type="button"
          onClick={() => setNewTask({ ...newTask, is_colleague_request: !newTask.is_colleague_request })}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${newTask.is_colleague_request
            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            : "border-[#04154D]/10 dark:border-white/10 text-[#04154D]/50 dark:text-white/50"}`}>
          <Users size={14} /> {newTask.is_colleague_request ? "✓ Colleague Request" : "Mark as Colleague Request"}
        </button>

        <button type="submit"
          className="w-full bg-[#04154D] dark:bg-[#2A59FF] text-white font-bold text-sm py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg">
          <Plus size={18} /> {newTask.start_date ? "Add & Schedule" : "Add to Inbox"}
        </button>
      </motion.form>
    </div>
  );
}

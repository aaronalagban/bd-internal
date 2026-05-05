"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Square, Play, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Task, UserScope } from "../../types";
import { PIC_COLORS, URGENCY_COLORS, STATUS_COLORS, TASK_STATES } from "../../constants";
import { isOverdue } from "../../lib/utils";

interface TaskRowProps {
  task: Task;
  loggedInUser: string | null;
  workingOnTask: Record<string, string | null>;
  userScope: UserScope;
  setEnrichTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleWorkingOn: (member: string, taskId: string) => void;
  setDeferTask: (task: Task) => void;
  setDeferDate: (date: string) => void;
}

export function TaskRow({
  task,
  loggedInUser,
  workingOnTask,
  userScope,
  setEnrichTask,
  updateTask,
  toggleWorkingOn,
  setDeferTask,
  setDeferDate,
}: TaskRowProps) {
  const overdue = isOverdue(task);
  const isDone = task.status === "Done";
  const isDeferred = task.status === "Deferred";
  const uColor = URGENCY_COLORS[task.urgency || "Routine"];
  const ref = task.end_date || task.start_date;
  const isWorking = loggedInUser ? workingOnTask[loggedInUser] === task.id : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={() => setEnrichTask(task)}
      className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all
        ${isWorking ? "ring-2 ring-[#2A59FF]/40 bg-[#2A59FF]/5 border-[#2A59FF]/30" :
          isDone
            ? "opacity-50 bg-[#FBFBFD] dark:bg-[#1A1A1D] border-[#04154D]/5 dark:border-white/5"
            : isDeferred
              ? "opacity-60 bg-slate-500/5 dark:bg-slate-500/10 border-slate-500/10"
              : overdue
                ? "bg-red-500/5 dark:bg-red-500/10 border-red-500/20 hover:border-red-500/40"
                : "bg-white dark:bg-[#1A1A1D] border-[#04154D]/8 dark:border-white/8 hover:border-[#2A59FF]/30 hover:shadow-sm"
        }`}
    >
      <button
        onClick={e => {
          e.stopPropagation();
          const next = isDone ? "To Do" : task.status === "To Do" ? "Ongoing" : task.status === "Ongoing" ? "Done" : "Done";
          updateTask(task.id, { status: next });
        }}
        className="shrink-0"
      >
        {isDone
          ? <CheckCircle2 size={18} className="text-emerald-500" />
          : <Circle size={18} className={`transition-colors group-hover:text-[#2A59FF] ${overdue ? "text-red-400" : "text-[#04154D]/20 dark:text-white/20"}`} />
        }
      </button>

      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${uColor.dot}`} />

      <span className={`flex-1 text-sm font-semibold truncate ${isDone ? "line-through text-[#04154D]/40 dark:text-white/40" : "text-[#04154D] dark:text-white"}`}>
        {task.title}
      </span>

      {task.pic === loggedInUser && !isDone && !isDeferred && (
        <button
          onClick={e => {
            e.stopPropagation();
            toggleWorkingOn(loggedInUser!, task.id);
          }}
          title={isWorking ? "Stop working on this" : "Mark as currently working on"}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all border
            ${isWorking
              ? "bg-[#2A59FF] border-[#2A59FF] text-white shadow-sm"
              : "border-[#04154D]/10 dark:border-white/10 text-[#04154D]/30 dark:text-white/30 hover:border-[#2A59FF]/40 hover:text-[#2A59FF]"
            }`}
        >
          {isWorking ? <><Square size={8} fill="currentColor" /> Currently Working On</> : <><Play size={8} /> Do</>}
        </button>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {overdue && !isDone && !isDeferred && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
            Overdue {ref ? format(parseISO(ref), "MMM d") : ""}
          </span>
        )}
        {isDeferred && ref && (
          <span className="text-[9px] font-bold text-slate-500 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded">
            Deferred → {format(parseISO(ref), "MMM d")}
          </span>
        )}
        {!overdue && !isDeferred && ref && !isDone && (
          <span className="text-[9px] font-bold text-[#04154D]/30 dark:text-white/30">{format(parseISO(ref), "MMM d")}</span>
        )}
        {task.is_colleague_request && (
          <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">Collab</span>
        )}
        {userScope === "team" && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${PIC_COLORS[task.pic]?.bg} ${PIC_COLORS[task.pic]?.border} ${PIC_COLORS[task.pic]?.text}`}>
            {task.pic.charAt(0)}
          </div>
        )}
        <select
          value={task.status}
          onChange={e => {
            e.stopPropagation();
            if (e.target.value === "Deferred") {
              setDeferTask(task);
              setDeferDate(format(new Date(), "yyyy-MM-dd")); // Simplified for prop
            } else {
              updateTask(task.id, { status: e.target.value });
            }
          }}
          onClick={e => e.stopPropagation()}
          className={`text-[9px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer transition-colors shrink-0
            ${STATUS_COLORS[task.status]?.bg || ""} ${STATUS_COLORS[task.status]?.border || ""} ${STATUS_COLORS[task.status]?.text || ""}`}
        >
          {TASK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronRight size={14} className="text-[#04154D]/20 dark:text-white/20 group-hover:text-[#2A59FF] transition-colors" />
      </div>
    </motion.div>
  );
}

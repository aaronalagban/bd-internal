"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { Sun, Moon, LogOut, Square, AlertCircle, Eye, Play, Plus } from "lucide-react";
import { format } from "date-fns";
import { Task } from "../../types";
import { PIC_COLORS, TEAM_MEMBERS, TASK_STATES } from "../../constants";
import { isOverdue } from "../../lib/utils";

interface MobileViewProps {
  tasks: Task[];
  loggedInUser: string | null;
  workingOnTask: Record<string, string | null>;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean | ((p: boolean) => boolean)) => void;
  handleLogout: () => void;
  toggleWorkingOn: (member: string, taskId: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setFocusedMember: (member: string | null) => void;
  setShowQuickAdd: (show: boolean) => void;
  renderWorkingOnOverlay: () => React.ReactNode;
  renderQuickAdd: () => React.ReactNode;
  renderDeferModal: () => React.ReactNode;
}

export function MobileView({
  tasks,
  loggedInUser,
  workingOnTask,
  isDarkMode,
  setIsDarkMode,
  handleLogout,
  toggleWorkingOn,
  updateTask,
  setFocusedMember,
  setShowQuickAdd,
  renderWorkingOnOverlay,
  renderQuickAdd,
  renderDeferModal,
}: MobileViewProps) {
  const today = new Date();
  const myTasks = tasks.filter(t => t.pic === loggedInUser && t.status !== "Deferred");
  const myOverdue = myTasks.filter(isOverdue);
  const activeTaskId = loggedInUser ? workingOnTask[loggedInUser] : null;
  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;

  return (
    <div className={`flex flex-col h-[100dvh] w-full overflow-hidden bg-[#050505] text-white ${isDarkMode ? "dark" : ""}`}>
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 shrink-0 border-b border-white/5">
        <div>
          <h1 className="text-lg font-black text-white">BD TEAM</h1>
          <p className="text-[10px] text-white/40 font-bold">{format(today, "EEE, MMM d")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDarkMode(p => !p)} className="p-2 rounded-xl bg-white/5 text-white/50">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${PIC_COLORS[loggedInUser!]?.bg} ${PIC_COLORS[loggedInUser!]?.border} ${PIC_COLORS[loggedInUser!]?.text}`}>
            {loggedInUser!.charAt(0)}
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl bg-white/5 text-red-400">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="bg-[#2A59FF]/10 border border-[#2A59FF]/20 rounded-3xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#2A59FF] mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2A59FF] animate-pulse" /> Working On
          </p>
          {activeTask ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white flex-1 truncate">{activeTask.title}</p>
              <button onClick={() => toggleWorkingOn(loggedInUser!, activeTask.id)}
                className="shrink-0 p-1.5 bg-white/10 rounded-lg text-white/50">
                <Square size={12} fill="currentColor" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-white/30 italic">Nothing playing</p>
          )}
        </div>

        {myOverdue.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-red-400">{myOverdue.length} overdue</p>
              <p className="text-[10px] text-red-400/60">{myOverdue.map(t => t.title).join(", ")}</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Team Status</p>
          <div className="space-y-2">
            {TEAM_MEMBERS.filter(m => m !== loggedInUser).map(m => {
              const memberActiveId = workingOnTask[m];
              const memberActiveTask = memberActiveId ? tasks.find(t => t.id === memberActiveId) : null;
              const c = PIC_COLORS[m];
              return (
                <button key={m} onClick={() => setFocusedMember(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] ${c.bg} ${c.border}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border ${c.bg} ${c.border} ${c.text}`}>{m.charAt(0)}</div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs font-bold ${c.text}`}>{m}</p>
                    <p className="text-[9px] text-white/30 truncate">
                      {memberActiveTask ? `▶ ${memberActiveTask.title}` : "Not playing anything"}
                    </p>
                  </div>
                  <Eye size={13} className="text-white/20 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {myTasks.filter(t => t.urgency === "Urgent" && t.status !== "Done" && t.status !== "Ongoing").length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Urgent</p>
            <div className="space-y-2">
              {myTasks.filter(t => t.urgency === "Urgent" && t.status !== "Done" && t.status !== "Ongoing").map(t => (
                <div key={t.id} className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs font-semibold text-white flex-1 truncate">{t.title}</span>
                  <button
                    onClick={() => toggleWorkingOn(loggedInUser!, t.id)}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${workingOnTask[loggedInUser!] === t.id ? "bg-[#2A59FF] text-white" : "bg-white/5 text-white/40"}`}
                  >
                    {workingOnTask[loggedInUser!] === t.id ? <Square size={12} fill="currentColor" /> : <Play size={12} />}
                  </button>
                  <select value={t.status} onChange={e => updateTask(t.id, { status: e.target.value })}
                    className="text-[9px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer bg-transparent text-white border-white/10">
                    {TASK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pb-safe pb-6 pt-3 border-t border-white/5">
        <button onClick={() => setShowQuickAdd(true)}
          className="w-full bg-[#2A59FF] text-white font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#2A59FF]/30">
          <Plus size={18} /> Quick Add Task
        </button>
      </div>

      <AnimatePresence>{renderWorkingOnOverlay()}</AnimatePresence>
      <AnimatePresence>{renderQuickAdd()}</AnimatePresence>
      <AnimatePresence>{renderDeferModal()}</AnimatePresence>
    </div>
  );
}

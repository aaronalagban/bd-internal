"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, User, Users, AlertCircle, Plus, Activity as ActivityIcon, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { Task, UserScope, TeamLoad } from "../../types";
import { TaskRow } from "./TaskRow";
import { MiniGantt } from "./MiniGantt";
import { TeamLoadSection } from "./TeamLoadSection";
import { Activity } from "./ActivityLog";

interface DashboardViewProps {
  tasks: Task[];
  loggedInUser: string | null;
  userScope: UserScope;
  setUserScope: (scope: UserScope) => void;
  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  isCurrentWeek: boolean;
  today: Date;
  weekStart: Date;
  weekEnd: Date;
  weekDays: Date[];
  weekTasks: Task[];
  urgentTasks: Task[];
  routineTasks: Task[];
  overdueTasks: Task[];
  doneTasks: Task[];
  unscheduled: Task[];
  doneCount: number;
  overdueCount: number;
  forReviewAll: Task[];
  teamLoad: TeamLoad[];
  workingOnTask: Record<string, string | null>;
  inWeek: (t: Task) => boolean;
  setActiveTab: (tab: "dashboard" | "calendar" | "timeblock") => void;
  setEnrichTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleWorkingOn: (member: string, taskId: string) => void;
  setShowForReview: (show: boolean) => void;
  setShowQuickAdd: (show: boolean) => void;
  setDeferTask: (task: Task) => void;
  setDeferDate: (date: string) => void;
  setFocusedMember: (member: string) => void;
}

export function DashboardView({
  tasks,
  loggedInUser,
  userScope,
  setUserScope,
  weekOffset,
  setWeekOffset,
  isCurrentWeek,
  today,
  weekStart,
  weekEnd,
  weekDays,
  weekTasks,
  urgentTasks,
  routineTasks,
  overdueTasks,
  doneTasks,
  unscheduled,
  doneCount,
  overdueCount,
  forReviewAll,
  teamLoad,
  workingOnTask,
  inWeek,
  setActiveTab,
  setEnrichTask,
  updateTask,
  toggleWorkingOn,
  setShowForReview,
  setShowQuickAdd,
  setDeferTask,
  setDeferDate,
  setFocusedMember,
}: DashboardViewProps) {
  return (
    <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex overflow-hidden">

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-[#04154D]/5 dark:border-white/5">
        <div className="flex items-center justify-between px-6 md:px-8 pt-5 md:pt-7 pb-4 md:pb-5 shrink-0 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-black text-[#04154D] dark:text-white tracking-tight leading-tight">
                {isCurrentWeek ? format(today, "EEEE, MMMM do") : "Past / Future Week"}
              </h2>
              <div className="flex items-center gap-1 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-xl px-2 py-1">
                <button onClick={() => setWeekOffset(p => p - 1)} className="p-1 rounded-lg hover:bg-[#04154D]/5 dark:hover:bg-white/5 transition-colors text-[#04154D] dark:text-white">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setWeekOffset(0)} className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${isCurrentWeek ? "text-[#2A59FF]" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#2A59FF]"}`}>
                  {isCurrentWeek ? "This Week" : weekOffset < 0 ? `${Math.abs(weekOffset)}w ago` : `+${weekOffset}w`}
                </button>
                <button onClick={() => setWeekOffset(p => p + 1)} className="p-1 rounded-lg hover:bg-[#04154D]/5 dark:hover:bg-white/5 transition-colors text-[#04154D] dark:text-white">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <p className="text-[#2A59FF] font-bold uppercase tracking-widest text-xs mt-1">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex bg-[#FBFBFD] dark:bg-[#1A1A1D] p-1.5 rounded-2xl border border-[#04154D]/10 dark:border-white/10 shadow-inner">
            <button onClick={() => setUserScope("member")}
              className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "member" ? "bg-[#2A59FF] text-white shadow-md" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
              <User size={14} /> Mine
            </button>
            <button onClick={() => setUserScope("team")}
              className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "team" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-md" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
              <Users size={14} /> Team
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 md:px-8 pb-8 space-y-5">
          {urgentTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Urgent</span>
                <span className="text-[10px] font-bold text-[#04154D]/25 dark:text-white/25">({urgentTasks.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {urgentTasks.map(t => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      loggedInUser={loggedInUser}
                      workingOnTask={workingOnTask}
                      userScope={userScope}
                      setEnrichTask={setEnrichTask}
                      updateTask={updateTask}
                      toggleWorkingOn={toggleWorkingOn}
                      setDeferTask={setDeferTask}
                      setDeferDate={setDeferDate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {routineTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/50 dark:text-white/50">Routine & Scheduled</span>
                <span className="text-[10px] font-bold text-[#04154D]/25 dark:text-white/25">({routineTasks.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {routineTasks.map(t => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      loggedInUser={loggedInUser}
                      workingOnTask={workingOnTask}
                      userScope={userScope}
                      setEnrichTask={setEnrichTask}
                      updateTask={updateTask}
                      toggleWorkingOn={toggleWorkingOn}
                      setDeferTask={setDeferTask}
                      setDeferDate={setDeferDate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Completed</span>
                <span className="text-[10px] font-bold text-[#04154D]/25 dark:text-white/25">({doneTasks.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {doneTasks.map(t => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      loggedInUser={loggedInUser}
                      workingOnTask={workingOnTask}
                      userScope={userScope}
                      setEnrichTask={setEnrichTask}
                      updateTask={updateTask}
                      toggleWorkingOn={toggleWorkingOn}
                      setDeferTask={setDeferTask}
                      setDeferDate={setDeferDate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {weekTasks.length === 0 && unscheduled.length === 0 && overdueTasks.length === 0 && (
            <div className="text-center py-16 text-[#04154D]/20 dark:text-white/20">
              <ActivityIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-black uppercase tracking-widest text-sm">Nothing this week.</p>
            </div>
          )}

          {overdueTasks.length > 0 && (
            <div className="pt-5 border-t border-[#04154D]/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Overdue (Needs Rescheduling)</span>
                <span className="text-[10px] font-bold text-[#04154D]/25 dark:text-white/25">({overdueTasks.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {overdueTasks.map(t => (
                  <div key={t.id} onClick={() => setEnrichTask(t)}
                    className="min-w-[180px] max-w-[220px] p-3 bg-red-500/5 border border-red-500/20 rounded-2xl cursor-pointer hover:border-red-500/50 transition-colors shrink-0 shadow-sm">
                    <p className="text-xs font-bold text-[#04154D] dark:text-white truncate mb-1">{t.title}</p>
                    <p className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Click to reschedule →</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unscheduled.length > 0 && (
            <div className={`${overdueTasks.length > 0 ? "pt-2" : "pt-5 border-t border-[#04154D]/5 dark:border-white/5"}`}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={12} className="text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">Unscheduled Inbox</span>
                <span className="text-[10px] font-bold text-[#04154D]/25 dark:text-white/25">({unscheduled.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {unscheduled.map(t => (
                  <div key={t.id} onClick={() => setEnrichTask(t)}
                    className="min-w-[180px] max-w-[220px] p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl cursor-pointer hover:border-yellow-500/50 transition-colors shrink-0 shadow-sm">
                    <p className="text-xs font-bold text-[#04154D] dark:text-white truncate mb-1">{t.title}</p>
                    <p className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">Click to schedule →</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-64 lg:w-72 xl:w-80 shrink-0 flex flex-col overflow-hidden bg-[#FBFBFD] dark:bg-[#050505]">
        <div className="p-5 md:p-6 border-b border-[#04154D]/5 dark:border-white/5 overflow-y-auto flex-1 no-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40">Team Load</h3>
          </div>
          <TeamLoadSection
            tasks={tasks}
            teamLoad={teamLoad}
            workingOnTask={workingOnTask}
            setEnrichTask={setEnrichTask}
            setFocusedMember={setFocusedMember}
          />
        </div>

        <div className="p-5 md:p-6 border-b border-[#04154D]/5 dark:border-white/5 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Done", value: `${doneCount}/${weekTasks.length}`, color: "text-[#2A59FF]", bg: "bg-white dark:bg-[#121214]", border: "border-[#04154D]/10 dark:border-white/10" },
              { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-[#04154D] dark:text-white", bg: overdueCount > 0 ? "bg-red-500/5 dark:bg-red-500/10" : "bg-white dark:bg-[#121214]", border: overdueCount > 0 ? "border-red-500/20" : "border-[#04154D]/10 dark:border-white/10" },
              { label: "Review", value: forReviewAll.length, color: forReviewAll.length > 0 ? "text-[#FF5B24]" : "text-[#04154D] dark:text-white", bg: forReviewAll.length > 0 ? "bg-[#FF5B24]/5" : "bg-white dark:bg-[#121214]", border: forReviewAll.length > 0 ? "border-[#FF5B24]/20" : "border-[#04154D]/10 dark:border-white/10" },
              { label: "Inbox", value: unscheduled.length, color: "text-[#04154D] dark:text-white", bg: "bg-white dark:bg-[#121214]", border: "border-[#04154D]/10 dark:border-white/10" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3 flex flex-col items-center justify-center text-center`}>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 md:p-6 border-t border-[#04154D]/5 dark:border-white/5 shrink-0 space-y-3">
          <button onClick={() => setShowForReview(true)}
            className="w-full bg-[#FF5B24] rounded-2xl p-4 flex items-center justify-between text-white hover:scale-[1.02] transition-transform shadow-lg shadow-[#FF5B24]/20">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Pending Reviews</p>
              <p className="text-3xl font-black">{forReviewAll.length}</p>
            </div>
            <AlertCircle size={26} className="opacity-60" />
          </button>
          <button onClick={() => setShowQuickAdd(true)}
            className="w-full bg-[#04154D] dark:bg-[#2A59FF] text-white font-bold text-sm py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg">
            <Plus size={18} /> Quick Add Task
          </button>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Users, ArrowLeft, ArrowRight, GripHorizontal, LayoutGrid, List } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getMonth, parseISO, addDays, getDay, subDays, isBefore } from "date-fns";
import { Task, UserScope } from "../../types";
import { PIC_COLORS, URGENCY_COLORS, TEAM_MEMBERS } from "../../constants";
import { getMonthName, isOverdue } from "../../lib/utils";

interface CalendarViewProps {
  tasks: Task[];
  visibleTasks: Task[];
  userScope: UserScope;
  setUserScope: (scope: UserScope) => void;
  currentMonth: number;
  setCurrentMonth: (updater: (p: number) => number | number) => void;
  today: Date;
  draggingTaskId: string | null;
  setDraggingTaskId: (id: string | null) => void;
  dragOverDate: string | null;
  setDragOverDate: (date: string | null) => void;
  unscheduled: Task[];
  overdue: Task[];
  setEnrichTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export function CalendarView({
  tasks,
  visibleTasks,
  userScope,
  setUserScope,
  currentMonth,
  setCurrentMonth,
  today,
  draggingTaskId,
  setDraggingTaskId,
  dragOverDate,
  setDragOverDate,
  unscheduled,
  overdue,
  setEnrichTask,
  updateTask,
}: CalendarViewProps) {
  const [teamViewMode, setTeamViewMode] = useState<"split" | "consolidated">("consolidated");

  const monthStart = startOfMonth(new Date(2026, currentMonth - 1));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < calDays.length; i += 7) {
    weeks.push(calDays.slice(i, i + 7));
  }

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    setDraggingTaskId(taskId);
  };

  const onDrop = (e: React.DragEvent, dropDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    setDraggingTaskId(null);
    setDragOverDate(null);
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const dropStr = format(dropDate, "yyyy-MM-dd");
    if (!task.start_date) {
      updateTask(taskId, { start_date: dropStr, end_date: dropStr });
    } else {
      const dur = Math.round(
        (parseISO(task.end_date || task.start_date).getTime() - parseISO(task.start_date).getTime()) / 86400000
      );
      updateTask(taskId, { start_date: dropStr, end_date: format(addDays(dropDate, dur), "yyyy-MM-dd") });
    }
  };

  const handleExtend = (taskId: string, dir: "left" | "right", start: string, end: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dir === "left") {
      updateTask(taskId, { start_date: format(subDays(parseISO(start), 1), "yyyy-MM-dd") });
    } else {
      updateTask(taskId, { end_date: format(addDays(parseISO(end), 1), "yyyy-MM-dd") });
    }
  };

  // Filter out Done tasks from the timeline
  const activeTimelineTasks = visibleTasks.filter(t => t.status !== "Done");

  // Helper to calculate non-overlapping lanes for tasks within a specific week
  const getTaskLanes = (weekTasks: Task[]) => {
    const sorted = [...weekTasks].sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
    const lanes: Task[][] = [];
    sorted.forEach(task => {
      const laneIdx = lanes.findIndex(lane => {
        const last = lane[lane.length - 1];
        const lastEnd = last.end_date || last.start_date!;
        // Simple string comparison works for YYYY-MM-DD
        return (task.start_date || "") > lastEnd;
      });
      if (laneIdx === -1) {
        lanes.push([task]);
      } else {
        lanes[laneIdx].push(task);
      }
    });
    return lanes;
  };

  const renderCalendarGrid = (memberFilter?: string) => {
    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-[300px] overflow-hidden" key={memberFilter || "all"}>
        {memberFilter && (
          <div className="text-center font-black uppercase tracking-widest text-xs mb-2 bg-white dark:bg-[#121214] py-2 rounded-xl border border-[#04154D]/10 dark:border-white/10 shadow-sm" style={{ color: PIC_COLORS[memberFilter]?.text?.split(' ')[0].replace('text-', '') || 'inherit' }}>
            {memberFilter}
          </div>
        )}
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-2 shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className={`text-center font-bold text-[9px] uppercase tracking-widest ${d === "Sat" || d === "Sun" ? "text-[#04154D]/15 dark:text-white/15" : "text-[#04154D]/25 dark:text-white/25"}`}>{d}</div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-1.5 min-h-0">
          {weeks.map((week, wIdx) => {
            const wStart = week[0];
            const wEnd = new Date(week[week.length - 1]); wEnd.setHours(23, 59, 59);

            const wTasks = activeTimelineTasks.filter(t => {
              if (!t.start_date || t.status === "Deferred") return false;
              if (memberFilter && t.pic !== memberFilter) return false;
              const ts = parseISO(t.start_date);
              const te = parseISO(t.end_date || t.start_date);
              return ts <= wEnd && te >= wStart;
            });

            // Calculate layout rows dynamically
            let weekHeight = 84;
            const rowsData: { label: string | null, lanes: Task[][] }[] = [];

            if (userScope === "team" && !memberFilter) {
              TEAM_MEMBERS.forEach(m => {
                const memberTasks = wTasks.filter(t => t.pic === m);
                const lanes = getTaskLanes(memberTasks);
                rowsData.push({ label: m, lanes });
              });
              const totalLanes = rowsData.reduce((sum, r) => sum + Math.max(1, r.lanes.length), 0);
              weekHeight = Math.max(84, totalLanes * 38 + 40);
            } else {
              const lanes = getTaskLanes(wTasks);
              rowsData.push({ label: null, lanes });
              weekHeight = Math.max(84, lanes.length * 36 + 40);
            }

            return (
              <div key={wIdx}
                className="relative w-full border border-[#04154D]/8 dark:border-white/8 rounded-2xl overflow-visible bg-[#FBFBFD] dark:bg-[#121214]"
                style={{ minHeight: `${weekHeight}px` }}>

                <div className="absolute inset-0 grid grid-cols-7 rounded-2xl overflow-hidden">
                  {week.map((day, i) => {
                    const ds = format(day, "yyyy-MM-dd");
                    const isDragOver = dragOverDate === ds;
                    const isToday = isSameDay(day, today);
                    const isWeekendDay = day.getDay() === 0 || day.getDay() === 6;
                    const isThisMonth = getMonth(day) === currentMonth - 1;
                    const isOverflowDay = !isThisMonth;

                    // Workload Heatmap Logic
                    const tasksOnDay = activeTimelineTasks.filter(t => {
                      if (!t.start_date || t.status === "Deferred") return false;
                      if (memberFilter && t.pic !== memberFilter) return false;
                      const ts = parseISO(t.start_date);
                      const te = parseISO(t.end_date || t.start_date);
                      return day >= ts && day <= te;
                    });
                    const highWorkload = tasksOnDay.length >= 5;

                    return (
                      <div key={i}
                        onDragOver={!isWeekendDay ? e => { e.preventDefault(); setDragOverDate(ds); } : undefined}
                        onDrop={!isWeekendDay ? e => onDrop(e, day) : undefined}
                        onDragLeave={() => setDragOverDate(null)}
                        className={`border-r border-[#04154D]/5 dark:border-white/5 last:border-r-0 p-2 transition-colors duration-75 relative
                          ${isWeekendDay ? "bg-[#04154D]/[0.025] dark:bg-white/[0.025]" : ""}
                          ${isToday && !isWeekendDay ? "bg-[#2A59FF]/5" : ""}
                          ${isDragOver && !isWeekendDay ? "bg-[#2A59FF]/10" : ""}
                          ${highWorkload && !isWeekendDay && !isDragOver && !isToday ? "bg-orange-500/10 dark:bg-orange-500/20" : ""}
                        `}>
                        <div className="flex flex-col items-center">
                          <span className={`text-[9px] font-bold leading-none
                            ${isToday ? "text-[#2A59FF]" : isOverflowDay ? "text-[#04154D]/15 dark:text-white/15" : isWeekendDay ? "text-[#04154D]/15 dark:text-white/15" : "text-[#04154D]/20 dark:text-white/20"}`}>
                            {format(day, "d")}
                          </span>
                          {isOverflowDay && (
                            <span className="text-[7px] font-bold text-[#04154D]/10 dark:text-white/10 uppercase tracking-wider leading-none mt-0.5">
                              {format(day, "MMM")}
                            </span>
                          )}
                        </div>
                      </div>                    );
                  })}
                </div>

                <div className="absolute top-7 left-0 right-0 bottom-0 px-1 pointer-events-none">
                  {(() => {
                    let currentTopOffset = 0;
                    return rowsData.map((row, rowIdx) => {
                      const rowUI = row.lanes.map((lane, laneIdx) => {
                        return lane.map(task => {
                          const ts = parseISO(task.start_date!);
                          const te = parseISO(task.end_date || task.start_date!);
                          const monday = week[1];
                          const friday = week[5];
                          const eStart = ts < monday ? monday : ts > friday ? null : ts;
                          const eEnd = te > friday ? friday : te < monday ? null : te;
                          if (!eStart || !eEnd) return null;

                          const startDow = getDay(eStart);
                          const endDow = getDay(eEnd);
                          const span = endDow - startDow + 1;

                          const colors = userScope === "team" ? PIC_COLORS[task.pic] || PIC_COLORS["Bien"] : URGENCY_COLORS[task.urgency || "Routine"];
                          const overdue = isOverdue(task);

                          return (
                            <div key={`${task.id}-${wIdx}`}
                              draggable
                              onDragStart={e => onDragStart(e, task.id)}
                              onDragEnd={() => { setDraggingTaskId(null); setDragOverDate(null); }}
                              onClick={() => setEnrichTask(task)}
                              title={task.title}
                              className={`absolute h-7 rounded-md flex items-center shadow-sm cursor-grab active:cursor-grabbing pointer-events-auto border transition-all hover:scale-[1.01] hover:z-10 group select-none
                                ${overdue ? "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400" : `${colors?.bg || ""} ${colors?.border || ""} ${colors?.text || ""}`}
                                ${draggingTaskId === task.id ? "opacity-40" : ""}
                              `}
                              style={{
                                left: `calc(${(startDow / 7) * 100}% + 2px)`,
                                width: `calc(${(span / 7) * 100}% - 4px)`,
                                top: `${currentTopOffset + laneIdx * 34}px`
                              }}>

                              <button onClick={e => handleExtend(task.id, "left", task.start_date!, task.end_date || task.start_date!, e)}
                                className="absolute -left-3 hidden group-hover:flex items-center justify-center w-5 h-5 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/15 dark:border-white/15 rounded-full shadow-md z-20 hover:scale-125 transition-transform text-[#04154D] dark:text-white cursor-pointer">
                                <ArrowLeft size={9} />
                              </button>

                              <div className="flex items-center gap-1.5 px-3 w-full overflow-hidden">
                                <GripHorizontal size={9} className="opacity-25 shrink-0" />
                                <span className="text-[9px] font-bold truncate flex-1">{task.title}</span>
                                {userScope === "team" && !memberFilter && <span className="text-[8px] font-black opacity-40 ml-auto shrink-0">{task.pic.charAt(0)}</span>}
                              </div>

                              <button onClick={e => handleExtend(task.id, "right", task.start_date!, task.end_date || task.start_date!, e)}
                                className="absolute -right-3 hidden group-hover:flex items-center justify-center w-5 h-5 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/15 dark:border-white/15 rounded-full shadow-md z-20 hover:scale-125 transition-transform text-[#04154D] dark:text-white cursor-pointer">
                                <ArrowRight size={9} />
                              </button>
                            </div>
                          );
                        });
                      });
                      
                      const rowHeight = Math.max(1, row.lanes.length) * 34 + (userScope === "team" && !memberFilter ? 14 : 0);
                      
                      const labelUI = userScope === "team" && !memberFilter && row.label && (
                        <div className="absolute left-1 flex items-center gap-1 opacity-50 pointer-events-none" style={{ top: `${currentTopOffset - 14}px` }}>
                          <div className={`w-1 h-1 rounded-full ${PIC_COLORS[row.label].bar || "bg-blue-500"}`} />
                          <span className="text-[7px] font-black uppercase tracking-widest text-[#04154D] dark:text-white">{row.label}</span>
                        </div>
                      );

                      currentTopOffset += rowHeight;
                      return <React.Fragment key={row.label || 'personal'}>{labelUI}{rowUI}</React.Fragment>;
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col p-4 md:p-8 overflow-hidden">

      <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-[#FBFBFD] dark:bg-[#1A1A1D] p-1.5 rounded-2xl border border-[#04154D]/10 dark:border-white/10 shadow-inner">
            <button onClick={() => setUserScope("member")}
              className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "member" ? "bg-[#2A59FF] text-white shadow-md" : "text-[#04154D]/50 dark:text-white/50"}`}>
              <User size={14} /> My Map
            </button>
            <button onClick={() => setUserScope("team")}
              className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "team" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-md" : "text-[#04154D]/50 dark:text-white/50"}`}>
              <Users size={14} /> Team Map
            </button>
          </div>

          {userScope === "team" && (
            <div className="flex bg-[#FBFBFD] dark:bg-[#1A1A1D] p-1 rounded-xl border border-[#04154D]/10 dark:border-white/10 shadow-inner">
              <button onClick={() => setTeamViewMode("consolidated")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${teamViewMode === "consolidated" ? "bg-white dark:bg-[#2A2A2E] text-[#04154D] dark:text-white shadow-sm" : "text-[#04154D]/50 dark:text-white/50"}`}>
                <List size={12} /> Consolidated
              </button>
              <button onClick={() => setTeamViewMode("split")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${teamViewMode === "split" ? "bg-white dark:bg-[#2A2A2E] text-[#04154D] dark:text-white shadow-sm" : "text-[#04154D]/50 dark:text-white/50"}`}>
                <LayoutGrid size={12} /> Split
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-wrap items-center gap-3 px-5 py-2.5 bg-[#FBFBFD] dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-full shadow-sm">
          {userScope === "team"
            ? TEAM_MEMBERS.map(m => (
                <div key={m} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${PIC_COLORS[m].bg} border ${PIC_COLORS[m].border}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${PIC_COLORS[m].text}`}>{m}</span>
                </div>
              ))
            : Object.entries(URGENCY_COLORS).map(([u, c]) => (
                <div key={u} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${c.bg} border ${c.border}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${c.text}`}>{u}</span>
                </div>
              ))
          }
          <div className="w-px h-3 bg-[#04154D]/10 dark:bg-white/10 mx-1" />
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm bg-orange-500/20 border border-orange-500/50`} />
            <span className={`text-[9px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400`}>Busy Day</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#FBFBFD] dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-full p-1 shadow-sm">
          <button onClick={() => setCurrentMonth(p => Math.max(1, p - 1))} className="p-2 rounded-full hover:bg-white dark:hover:bg-[#121214] text-[#04154D] dark:text-white transition-colors"><ArrowLeft size={15} /></button>
          <span className="text-xs font-bold uppercase tracking-widest px-3 md:px-4 text-[#04154D] dark:text-white">{getMonthName(currentMonth)} 2026</span>
          <button onClick={() => setCurrentMonth(p => Math.min(12, p + 1))} className="p-2 rounded-full hover:bg-white dark:hover:bg-[#121214] text-[#04154D] dark:text-white transition-colors"><ArrowRight size={15} /></button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 md:gap-5 min-h-0 overflow-hidden">
        {userScope === "member" && (
          <div className="w-44 md:w-52 flex flex-col bg-[#FBFBFD] dark:bg-[#1A1A1D] rounded-[2rem] border border-[#04154D]/10 dark:border-white/10 p-4 md:p-5 shrink-0 min-h-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 mb-1 shrink-0">Drag to Schedule</h3>
            <p className="text-[9px] text-[#04154D]/25 dark:text-white/25 font-medium mb-4 shrink-0">Drop on any weekday</p>
            <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar pb-4">
              {overdue.length > 0 && (
                <div className="mb-4">
                  <div className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2">Overdue (Reschedule)</div>
                  {overdue.map(t => (
                    <div key={t.id} draggable
                      onDragStart={e => onDragStart(e, t.id)}
                      onDragEnd={() => { setDraggingTaskId(null); setDragOverDate(null); }}
                      className={`mb-2 p-3 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-2xl cursor-grab active:cursor-grabbing hover:scale-105 transition-transform select-none ${draggingTaskId === t.id ? "opacity-40" : ""}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <GripHorizontal size={10} className="text-red-500/50" />
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border bg-white dark:bg-[#1A1A1D] border-red-500/20 text-red-600 dark:text-red-400`}>Overdue</span>
                      </div>
                      <p className="text-[11px] font-bold text-red-700 dark:text-red-300 leading-snug">{t.title}</p>
                    </div>
                  ))}
                </div>
              )}

              {unscheduled.length > 0 && (
                <div className="mb-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 mb-2">Unscheduled</div>
                  {unscheduled.map(t => {
                    const c = URGENCY_COLORS[t.urgency || "Routine"];
                    return (
                      <div key={t.id} draggable
                        onDragStart={e => onDragStart(e, t.id)}
                        onDragEnd={() => { setDraggingTaskId(null); setDragOverDate(null); }}
                        className={`mb-2 p-3 bg-white dark:bg-[#121214] border rounded-2xl cursor-grab active:cursor-grabbing hover:scale-105 transition-transform select-none ${c.border} ${draggingTaskId === t.id ? "opacity-40" : ""}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <GripHorizontal size={10} className="text-[#04154D]/20 dark:text-white/20" />
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>{t.urgency || "Routine"}</span>
                        </div>
                        <p className="text-[11px] font-bold text-[#04154D] dark:text-white leading-snug">{t.title}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {unscheduled.length === 0 && overdue.length === 0 && (
                <p className="text-xs text-center italic opacity-40 mt-10 text-[#04154D] dark:text-white">All scheduled!</p>
              )}
            </div>
          </div>
        )}

        {userScope === "team" && teamViewMode === "split" ? (
          <div className="flex-1 flex gap-4 overflow-x-auto no-scrollbar snap-x">
            {TEAM_MEMBERS.map(m => (
              <div key={m} className="snap-start min-w-[300px] flex-1">
                {renderCalendarGrid(m)}
              </div>
            ))}
          </div>
        ) : (
          renderCalendarGrid()
        )}
      </div>
    </motion.div>
  );
}

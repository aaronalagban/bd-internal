"use client";

import React from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Task } from "../../types";
import { URGENCY_COLORS } from "../../constants";
import { isOverdue } from "../../lib/utils";

interface MiniGanttProps {
  tasks: Task[];
  loggedInUser: string | null;
  inWeek: (t: Task) => boolean;
  weekDays: Date[];
  weekStart: Date;
  weekEnd: Date;
  today: Date;
  setEnrichTask: (task: Task) => void;
}

export function MiniGantt({
  tasks,
  loggedInUser,
  inWeek,
  weekDays,
  weekStart,
  weekEnd,
  today,
  setEnrichTask,
}: MiniGanttProps) {
  const myWeekTasks = tasks.filter(t => t.pic === loggedInUser && inWeek(t) && t.status !== "Deferred" && t.start_date);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-1 mb-0.5">
        {weekDays.map(d => (
          <div key={d.toISOString()} className={`text-center text-[9px] font-bold uppercase tracking-widest ${isSameDay(d, today) ? "text-[#2A59FF]" : "text-[#04154D]/25 dark:text-white/25"}`}>
            {format(d, "EEE")}
          </div>
        ))}
      </div>
      {myWeekTasks.length === 0 && (
        <p className="text-[11px] text-[#04154D]/25 dark:text-white/25 text-center py-4 italic">Nothing scheduled this week</p>
      )}
      {myWeekTasks.slice(0, 6).map(task => {
        const ts = parseISO(task.start_date!);
        const te = parseISO(task.end_date || task.start_date!);
        const clampStart = ts < weekStart ? weekStart : ts;
        const clampEnd = te > weekEnd ? weekEnd : te;
        const startCol = Math.max(0, clampStart.getDay() === 0 ? 4 : clampStart.getDay() - 1);
        const endCol = Math.min(4, clampEnd.getDay() === 0 ? 4 : clampEnd.getDay() - 1);
        const span = endCol - startCol + 1;
        const uColor = URGENCY_COLORS[task.urgency || "Routine"];
        const overdue = isOverdue(task);

        return (
          <div key={task.id} className="grid grid-cols-5 gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
            onClick={() => setEnrichTask(task)}>
            {startCol > 0 && <div style={{ gridColumn: `1 / span ${startCol}` }} />}
            <div
              style={{ gridColumn: `${startCol + 1} / span ${span}` }}
              className={`h-6 rounded-md flex items-center px-2 cursor-pointer border text-[9px] font-bold truncate transition-all hover:scale-[1.02]
                ${overdue ? "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400" : `${uColor.bg} ${uColor.border} ${uColor.text}`}`}
            >
              {task.title}
            </div>
          </div>
        );
      })}
      {myWeekTasks.length > 6 && (
        <p className="text-[9px] text-[#04154D]/25 dark:text-white/25 text-right">+{myWeekTasks.length - 6} more</p>
      )}
    </div>
  );
}

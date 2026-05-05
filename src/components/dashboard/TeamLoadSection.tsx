"use client";

import React, { useState } from "react";
import { ChevronRight, Eye } from "lucide-react";
import { Task, TeamLoad } from "../../types";
import { PIC_COLORS, URGENCY_COLORS, STATUS_COLORS } from "../../constants";

interface TeamLoadSectionProps {
  tasks: Task[];
  teamLoad: TeamLoad[];
  workingOnTask: Record<string, string | null>;
  setEnrichTask: (task: Task) => void;
  setFocusedMember: (member: string) => void;
}

export function TeamLoadSection({
  tasks,
  teamLoad,
  workingOnTask,
  setEnrichTask,
  setFocusedMember,
}: TeamLoadSectionProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {teamLoad.map(({ name, tasks: memberTasks }) => {
        const isExpanded = expandedMember === name;
        const activeTaskId = workingOnTask[name];
        const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;

        return (
          <div key={name} className="flex flex-col gap-1">
            <button
              onClick={() => setExpandedMember(isExpanded ? null : name)}
              className="flex items-center gap-3 w-full text-left"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border shrink-0 ${PIC_COLORS[name].bg} ${PIC_COLORS[name].border} ${PIC_COLORS[name].text}`}>
                {name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[11px] font-semibold text-[#04154D] dark:text-white">{name}</span>
                </div>
                {activeTask ? (
                  <p className={`text-[9px] font-bold truncate ${PIC_COLORS[name].text}`}>
                    ▶ {activeTask.title}
                  </p>
                ) : (
                  <p className="text-[9px] text-[#04154D]/25 dark:text-white/25 italic">Idle</p>
                )}
              </div>
              <ChevronRight size={12} className={`text-[#04154D]/20 dark:text-white/20 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
            </button>

            <button
              onClick={() => setFocusedMember(name)}
              className={`ml-10 flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all
                ${PIC_COLORS[name].bg} ${PIC_COLORS[name].border} ${PIC_COLORS[name].text} hover:scale-105`}
            >
              <Eye size={9} /> View status…
            </button>

            {isExpanded && memberTasks.length > 0 && (
              <div className="ml-10 flex flex-col gap-1.5 mt-1">
                {memberTasks.slice(0, 4).map((t: Task) => (
                  <div key={t.id}
                    onClick={() => setEnrichTask(t)}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/8 dark:border-white/8 rounded-xl cursor-pointer hover:border-[#2A59FF]/30 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full ${URGENCY_COLORS[t.urgency || "Routine"].dot}`} />
                    <span className="text-[10px] font-semibold text-[#04154D] dark:text-white truncate flex-1">{t.title}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[t.status]?.bg} ${STATUS_COLORS[t.status]?.border} ${STATUS_COLORS[t.status]?.text}`}>{t.status}</span>
                  </div>
                ))}
                {memberTasks.length > 4 && (
                  <p className="text-[9px] text-[#04154D]/25 dark:text-white/25 pl-3">+{memberTasks.length - 4} more</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

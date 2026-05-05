"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Users, GripHorizontal, X, Search } from "lucide-react";
import { parseISO, isSameDay } from "date-fns";
import { Task, UserScope, TimeBlock } from "../../types";
import { PIC_COLORS, URGENCY_COLORS, TEAM_MEMBERS, TOTAL_SLOTS, STATUS_COLORS } from "../../constants";
import { slotLabel, timeToSlot } from "../../lib/utils";

interface TimeBlockViewProps {
  tasks: Task[];
  loggedInUser: string | null;
  timeBlocks: Record<string, TimeBlock[]>;
  timeBlockDate: string;
  setTimeBlockDate: (date: string) => void;
  timeBlockScope: UserScope;
  setTimeBlockScope: (scope: UserScope) => void;
  tbFilter: "Today" | "This Week" | "Urgent" | "Routine" | "All";
  setTbFilter: (filter: "Today" | "This Week" | "Urgent" | "Routine" | "All") => void;
  sidebarTasks: Task[];
  draggingTBTaskId: string | null;
  setDraggingTBTaskId: (id: string | null) => void;
  resizingTB: { id: string; type: "top" | "bottom" } | null;
  setResizingTB: (resizing: { id: string; type: "top" | "bottom" } | null) => void;
  tbDragOverSlot: { member: string; slot: number } | null;
  setTbDragOverSlot: (slot: { member: string; slot: number } | null) => void;
  tbGridRef: React.RefObject<HTMLDivElement | null>;
  today: Date;
  setEnrichTask: (task: Task) => void;
  addTimeBlockEntry: (member: string, taskId: string, date: string, startSlot: number, endSlot: number) => void;
  updateTimeBlockBounds: (member: string, blockId: string, newStartSlot: number, newEndSlot: number, oldBlock: TimeBlock) => void;
  removeTimeBlock: (member: string, blockId: string) => void;
}

export function TimeBlockView({
  tasks,
  loggedInUser,
  timeBlocks,
  timeBlockDate,
  setTimeBlockDate,
  timeBlockScope,
  setTimeBlockScope,
  tbFilter,
  setTbFilter,
  sidebarTasks,
  draggingTBTaskId,
  setDraggingTBTaskId,
  resizingTB,
  setResizingTB,
  tbDragOverSlot,
  setTbDragOverSlot,
  tbGridRef,
  today,
  setEnrichTask,
  addTimeBlockEntry,
  updateTimeBlockBounds,
  removeTimeBlock,
}: TimeBlockViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
  const CELL_HEIGHT = 48;
  const members = timeBlockScope === "team" ? TEAM_MEMBERS : [loggedInUser as string];

  const blocksForDate = (member: string): TimeBlock[] =>
    (timeBlocks[member] || []).filter(b => b.date === timeBlockDate);

  const filteredSidebarTasks = sidebarTasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTimelineDrop = async (e: React.DragEvent, member: string, slotIdx: number) => {
    e.preventDefault();
    if (resizingTB) {
      const block = (timeBlocks[member] || []).find(b => b.id === resizingTB.id);
      if (block) {
        let sSlot = timeToSlot(block.start);
        let eSlot = timeToSlot(block.end);
        if (resizingTB.type === "top") {
          sSlot = Math.min(slotIdx, eSlot - 1);
        } else {
          eSlot = Math.max(slotIdx + 1, sSlot + 1);
        }
        if (sSlot < eSlot) {
          await updateTimeBlockBounds(member, block.id, sSlot, eSlot, block);
        }
      }
      setResizingTB(null);
      setTbDragOverSlot(null);
      return;
    }
    const taskId = e.dataTransfer.getData("tbTaskId");
    if (taskId) {
      await addTimeBlockEntry(member, taskId, timeBlockDate, slotIdx, slotIdx + 2);
      setTbDragOverSlot(null);
    }
  };

  return (
    <motion.div key="tb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex overflow-hidden">

      <div className="w-64 shrink-0 flex flex-col border-r border-[#04154D]/5 dark:border-white/5 bg-[#FBFBFD] dark:bg-[#050505]">
        <div className="px-4 pt-5 pb-3 border-b border-[#04154D]/5 dark:border-white/5 shrink-0">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 mb-0.5">Tasks</h3>
          <p className="text-[8px] text-[#04154D]/25 dark:text-white/25 font-medium mb-3">Drag to timeline. Drag block edges to resize.</p>
          
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#04154D]/30 dark:text-white/30" size={12} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-lg outline-none text-[#04154D] dark:text-white placeholder:text-[#04154D]/30 dark:placeholder:text-white/30"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {(["Today", "This Week", "Urgent", "Routine", "All"] as const).map(tab => (
              <button key={tab} onClick={() => setTbFilter(tab)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border
                  ${tbFilter === tab 
                    ? "bg-[#2A59FF] text-white border-transparent shadow-sm" 
                    : "bg-white dark:bg-[#1A1A1D] border-[#04154D]/10 dark:border-white/10 text-[#04154D]/50 dark:text-white/50 hover:border-[#2A59FF]/40 hover:text-[#2A59FF]"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2">
          {filteredSidebarTasks.length === 0 ? (
            <p className="text-[10px] italic text-[#04154D]/20 dark:text-white/20 text-center mt-8">No tasks found</p>
          ) : filteredSidebarTasks.map(t => {
            const colors = PIC_COLORS[t.pic] || PIC_COLORS["Bien"];
            const uColors = URGENCY_COLORS[t.urgency || "Routine"];
            return (
              <div key={t.id} draggable
                onDragStart={e => {
                  e.dataTransfer.setData("tbTaskId", t.id);
                  setDraggingTBTaskId(t.id);
                }}
                onDragEnd={() => setDraggingTBTaskId(null)}
                className={`px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing select-none transition-all hover:scale-[1.02] hover:shadow-sm
                  ${draggingTBTaskId === t.id ? "opacity-40" : ""}
                  ${timeBlockScope === "team" ? `${colors.bg} ${colors.border}` : `${uColors.bg} ${uColors.border}`}
                `}>
                <div className="flex items-center gap-1.5 mb-1">
                  <GripHorizontal size={9} className="opacity-30 shrink-0" />
                  {timeBlockScope === "team" && <span className={`text-[8px] font-black ${colors.text}`}>{t.pic}</span>}
                  <span className={`text-[8px] font-bold ${timeBlockScope === "team" ? colors.text : uColors.text} ml-auto`}>{t.urgency || "Routine"}</span>
                </div>
                <p className={`text-[10px] font-bold leading-snug ${timeBlockScope === "team" ? colors.text : uColors.text}`}>{t.title}</p>
                <div className={`mt-1.5 flex items-center gap-1 text-[7px] font-bold px-1.5 py-0.5 rounded w-fit border
                  ${STATUS_COLORS[t.status]?.bg} ${STATUS_COLORS[t.status]?.border} ${STATUS_COLORS[t.status]?.text}`}>
                  {t.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b border-[#04154D]/5 dark:border-white/5 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-[#04154D] dark:text-white">Time Blocks</h2>
            <p className="text-[#2A59FF] font-bold uppercase tracking-widest text-[10px] mt-0.5">7:00 AM – 6:30 PM</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-[#FBFBFD] dark:bg-[#1A1A1D] p-1 rounded-xl border border-[#04154D]/10 dark:border-white/10">
              <button onClick={() => setTimeBlockScope("member")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${timeBlockScope === "member" ? "bg-[#2A59FF] text-white shadow" : "text-[#04154D]/50 dark:text-white/50"}`}>
                <User size={13} /> Mine
              </button>
              <button onClick={() => setTimeBlockScope("team")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${timeBlockScope === "team" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow" : "text-[#04154D]/50 dark:text-white/50"}`}>
                <Users size={13} /> Team
              </button>
            </div>
            <input type="date" value={timeBlockDate} onChange={e => setTimeBlockDate(e.target.value)}
              className="bg-white dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-[#04154D] dark:text-white outline-none" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar" ref={tbGridRef}>
          <div className="flex min-h-full">
            <div className="w-14 shrink-0 border-r border-[#04154D]/5 dark:border-white/5 sticky left-0 bg-[#FBFBFD] dark:bg-[#0A0A0C] z-10">
              <div className="h-10" />
              {slots.map(i => (
                <div key={i} style={{ height: CELL_HEIGHT }}
                  className="flex items-start justify-end pr-3 pt-1.5 border-b border-[#04154D]/5 dark:border-white/5">
                  {i % 2 === 0 && <span className="text-[8px] font-bold text-[#04154D]/30 dark:text-white/30 whitespace-nowrap">{slotLabel(i)}</span>}
                </div>
              ))}
            </div>

            {members.map(member => {
              const memberBlocks = blocksForDate(member);
              return (
                <div key={member} className="flex-1 min-w-0 relative border-r border-[#04154D]/5 dark:border-white/5 last:border-r-0">
                  <div className={`h-10 flex items-center justify-center border-b border-[#04154D]/5 dark:border-white/5 sticky top-0 z-10 ${PIC_COLORS[member]?.bg || "bg-white dark:bg-[#121214]"}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${PIC_COLORS[member]?.text || ""}`}>{member}</span>
                  </div>
                  <div className="relative">
                    {slots.map(i => {
                      const slotStartMin = 7 * 60 + i * 30;
                      const nowTotalMin = today.getHours() * 60 + today.getMinutes();
                      const isNowSlot = Math.abs(slotStartMin - nowTotalMin) < 30 && isSameDay(parseISO(timeBlockDate), today);
                      const isDrop = tbDragOverSlot?.member === member && tbDragOverSlot?.slot === i;
                      return (
                        <div key={i} style={{ height: CELL_HEIGHT }}
                          onDragOver={e => { e.preventDefault(); setTbDragOverSlot({ member, slot: i }); }}
                          onDrop={e => handleTimelineDrop(e, member, i)}
                          onDragLeave={() => setTbDragOverSlot(null)}
                          className={`border-b border-[#04154D]/5 dark:border-white/5 transition-colors
                            ${i % 2 === 0 ? "" : "bg-[#04154D]/[0.008] dark:bg-white/[0.008]"}
                            ${isNowSlot ? "bg-[#2A59FF]/5" : ""}
                            ${isDrop ? "bg-[#2A59FF]/15" : ""}
                          `} />
                      );
                    })}

                    {(draggingTBTaskId || resizingTB) && (
                      <div className="absolute inset-0 z-50 flex flex-col">
                        {slots.map(i => (
                          <div key={`drop-${i}`} style={{ height: CELL_HEIGHT }}
                            onDragOver={e => { e.preventDefault(); setTbDragOverSlot({ member, slot: i }); }}
                            onDrop={e => handleTimelineDrop(e, member, i)}
                            onDragLeave={() => setTbDragOverSlot(null)}
                          />
                        ))}
                      </div>
                    )}

                    {memberBlocks.map(block => {
                      const task = tasks.find(t => t.id === block.taskId);
                      if (!task) return null;
                      const startSlot = timeToSlot(block.start);
                      const endSlot = timeToSlot(block.end);
                      const slotSpan = Math.max(1, endSlot - startSlot);
                      const top = startSlot * CELL_HEIGHT;
                      const height = slotSpan * CELL_HEIGHT - 4;
                      const colors = PIC_COLORS[task.pic] || PIC_COLORS["Bien"];
                      const uColors = URGENCY_COLORS[task.urgency || "Routine"];
                      const isResizingThis = resizingTB?.id === block.id;

                      return (
                        <div key={block.id} onClick={() => setEnrichTask(task)}
                          className={`absolute left-1 right-1 rounded-xl border transition-all shadow-sm overflow-hidden group
                            ${isResizingThis ? "opacity-60 scale-[0.98] z-30" : "hover:scale-[1.02] cursor-pointer"}
                            ${timeBlockScope === "team" ? `${colors.bg} ${colors.border}` : `${uColors.bg} ${uColors.border}`}
                          `}
                          style={{ top: `${top}px`, height: `${height}px`, zIndex: isResizingThis ? 40 : 10 }}>
                          
                          <div draggable
                            onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData("text/plain", ""); setResizingTB({ id: block.id, type: "top" }); }}
                            onDragEnd={() => { setResizingTB(null); setTbDragOverSlot(null); }}
                            className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize z-20 flex justify-center opacity-0 group-hover:opacity-100 bg-[#04154D]/10 dark:bg-white/10 hover:bg-[#04154D]/20 dark:hover:bg-white/20 transition-opacity">
                            <div className="w-8 h-1 rounded-full bg-[#04154D]/40 dark:bg-white/40 mt-1" />
                          </div>

                          <div className={`w-1 absolute left-0 top-0 bottom-0 ${timeBlockScope === "team" ? colors.bar : (task.urgency === "Urgent" ? "bg-red-500" : task.urgency === "Scheduled" ? "bg-emerald-500" : "bg-slate-400")}`} />
                          
                          <div className="pl-3 pr-2 pt-2.5 pb-2 h-full flex flex-col justify-start overflow-hidden pointer-events-none">
                            <p className={`text-[10px] font-black leading-tight truncate ${timeBlockScope === "team" ? colors.text : uColors.text}`}>{task.title}</p>
                            <p className="text-[8px] font-bold text-[#04154D]/30 dark:text-white/30 mt-0.5">{slotLabel(startSlot)} – {slotLabel(endSlot)}</p>
                          </div>

                          <button onClick={e => { e.stopPropagation(); removeTimeBlock(member, block.id); }}
                            className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 bg-white dark:bg-[#121214] rounded-full border border-[#04154D]/10 dark:border-white/10 text-[#04154D]/50 dark:text-white/50 hover:text-red-500 hover:border-red-500/30 shadow-sm transition-all z-30 sm:opacity-0 group-hover:opacity-100">
                            <X size={10} />
                          </button>

                          <div draggable
                            onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData("text/plain", ""); setResizingTB({ id: block.id, type: "bottom" }); }}
                            onDragEnd={() => { setResizingTB(null); setTbDragOverSlot(null); }}
                            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize z-20 flex justify-center items-end opacity-0 group-hover:opacity-100 bg-[#04154D]/10 dark:bg-white/10 hover:bg-[#04154D]/20 dark:hover:bg-white/20 transition-opacity">
                            <div className="w-8 h-1 rounded-full bg-[#04154D]/40 dark:bg-white/40 mb-1" />
                          </div>
                        </div>
                      );
                    })}

                    {isSameDay(parseISO(timeBlockDate), today) && (() => {
                      const nowMin = (today.getHours() - 7) * 60 + today.getMinutes();
                      if (nowMin < 0 || nowMin > (11 * 60 + 30)) return null;
                      const top = (nowMin / 30) * CELL_HEIGHT;
                      return (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#2A59FF] shrink-0" />
                            <div className="h-px bg-[#2A59FF] flex-1 opacity-60" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

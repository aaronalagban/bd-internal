"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Command, FileText, Clock } from "lucide-react";
import { Task } from "../../types";
import { PIC_COLORS, URGENCY_COLORS, STATUS_COLORS } from "../../constants";
import { format, parseISO } from "date-fns";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function SearchModal({ isOpen, onClose, tasks, onSelectTask }: SearchModalProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.notes?.toLowerCase().includes(q) ||
      t.pic.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, tasks]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#04154D]/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: -20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[#04154D]/5 dark:border-white/5">
          <Search size={22} className="text-[#04154D]/30 dark:text-white/30" />
          <input 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, notes, or members..."
            className="flex-1 bg-transparent text-lg font-bold text-[#04154D] dark:text-white outline-none placeholder:text-[#04154D]/20 dark:placeholder:text-white/20"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FBFBFD] dark:bg-[#1A1A1D] rounded-lg border border-[#04154D]/5 dark:border-white/5">
            <span className="text-[10px] font-black text-[#04154D]/30 dark:text-white/30 tracking-widest uppercase">ESC</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar max-h-[60vh]">
          {query && results.length === 0 && (
            <div className="p-12 text-center opacity-30">
              <Search size={40} className="mx-auto mb-3" />
              <p className="font-black uppercase tracking-widest text-sm text-[#04154D] dark:text-white">No results found</p>
            </div>
          )}

          {!query && (
            <div className="p-8 text-center opacity-20">
              <Command size={40} className="mx-auto mb-3" />
              <p className="font-black uppercase tracking-widest text-xs text-[#04154D] dark:text-white">Type to start searching...</p>
            </div>
          )}

          <div className="p-3 space-y-1">
            {results.map(task => {
              const colors = PIC_COLORS[task.pic];
              const uColors = URGENCY_COLORS[task.urgency || "Routine"];
              const sColors = STATUS_COLORS[task.status];

              return (
                <button 
                  key={task.id}
                  onClick={() => { onSelectTask(task); onClose(); }}
                  className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-[#FBFBFD] dark:hover:bg-[#1A1A1D] transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black border transition-transform group-hover:scale-110 ${colors.bg} ${colors.border} ${colors.text}`}>
                    {task.pic.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#04154D] dark:text-white truncate">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${uColors.text}`}>{task.urgency || "Routine"}</span>
                      <span className="w-1 h-1 rounded-full bg-[#04154D]/10 dark:bg-white/10" />
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sColors.bg} ${sColors.border} ${sColors.text}`}>{task.status}</span>
                      {task.start_date && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[#04154D]/10 dark:bg-white/10" />
                          <span className="text-[9px] font-bold text-[#04154D]/30 dark:text-white/30 flex items-center gap-1">
                            <Clock size={10} /> {format(parseISO(task.start_date), "MMM d")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <FileText size={16} className="text-[#04154D]/10 dark:text-white/10 group-hover:text-[#2A59FF] transition-colors" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 bg-[#FBFBFD] dark:bg-[#050505] border-t border-[#04154D]/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
               <span className="p-1 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded text-[8px] font-black text-[#04154D]/40 dark:text-white/40 shadow-sm">↑↓</span>
               <span className="text-[9px] font-bold text-[#04154D]/30 dark:text-white/30 uppercase tracking-tight">Navigate</span>
             </div>
             <div className="flex items-center gap-1.5">
               <span className="p-1 px-1.5 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded text-[8px] font-black text-[#04154D]/40 dark:text-white/40 shadow-sm">ENTER</span>
               <span className="text-[9px] font-bold text-[#04154D]/30 dark:text-white/30 uppercase tracking-tight">Select</span>
             </div>
          </div>
          <p className="text-[9px] font-bold text-[#2A59FF] uppercase tracking-widest">Global Search</p>
        </div>
      </motion.div>
    </div>
  );
}

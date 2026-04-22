"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertCircle, X, Plus, Zap, Link2, FileText,
  Users, User, LayoutDashboard, Calendar as CalendarIcon,
  Moon, Sun, ArrowLeft, ArrowRight, Activity, LogOut, Maximize2,
  GripHorizontal, Circle, Clock, ChevronRight, ChevronLeft,
  Timer, Eye
} from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isBefore,
  parseISO, getDay, isWeekend, isSameDay, startOfWeek, endOfWeek,
  addDays, subDays, addWeeks, subWeeks
} from "date-fns";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Task = {
  id: string;
  title: string;
  pic: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes?: string;
  urgency?: "Urgent" | "Routine" | "Scheduled";
  is_colleague_request?: boolean;
  links?: string;
  time_block_date?: string | null;
  time_block_start?: string | null; // "HH:MM"
  time_block_end?: string | null;   // "HH:MM"
};

type ViewMode = "dashboard" | "calendar" | "timeblock";
type UserScope = "member" | "team";
type TeamMember = "Bien" | "Aaron" | "Michelle";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TASK_STATES = ["To Do", "Ongoing", "For Review", "Deferred", "Done"];
const TEAM_MEMBERS: TeamMember[] = ["Bien", "Aaron", "Michelle"];

const TEAM_EMAILS: Record<string, string> = {
  Bien: "josiahsantiago22@gmail.com",
  Aaron: "aaronalagban@gmail.com",
  Michelle: "iammichmartinez@gmail.com",
};

const PIC_COLORS: Record<string, { bg: string; border: string; text: string; bar: string; solid: string }> = {
  Bien:     { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-700 dark:text-blue-400",     bar: "bg-blue-500",   solid: "#3b82f6" },
  Aaron:    { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-700 dark:text-orange-400", bar: "bg-orange-500", solid: "#f97316" },
  Michelle: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-700 dark:text-purple-400", bar: "bg-purple-500", solid: "#a855f7" },
};

const URGENCY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Urgent:    { bg: "bg-red-500/10 dark:bg-red-500/20",         border: "border-red-500/30",     text: "text-red-700 dark:text-red-400",       dot: "bg-red-500" },
  Routine:   { bg: "bg-slate-500/10 dark:bg-slate-500/20",     border: "border-slate-500/30",   text: "text-slate-700 dark:text-slate-300",   dot: "bg-slate-400" },
  Scheduled: { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "To Do":      { bg: "bg-slate-500/10 dark:bg-slate-500/20",     border: "border-slate-500/20",   text: "text-slate-600 dark:text-slate-400" },
  "Ongoing":    { bg: "bg-blue-500/10 dark:bg-blue-500/20",       border: "border-blue-500/20",     text: "text-blue-700 dark:text-blue-400" },
  "For Review": { bg: "bg-amber-500/10 dark:bg-amber-500/20",     border: "border-amber-500/20",   text: "text-amber-700 dark:text-amber-400" },
  "Deferred":   { bg: "bg-slate-500/5 dark:bg-slate-500/10",      border: "border-slate-500/10",   text: "text-slate-500 dark:text-slate-500" },
  "Done":       { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", border: "border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400" },
};

// Time block helpers
const DAY_START_HOUR = 7;   // 7 AM
const DAY_END_HOUR = 18;    // 6 PM (6:30 is last half slot)
const SLOT_MINUTES = 30;
const TOTAL_SLOTS = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES + 1; // 7:00–18:30

function slotLabel(slotIdx: number): string {
  const totalMinutes = DAY_START_HOUR * 60 + slotIdx * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h - DAY_START_HOUR) * 60 + m) / SLOT_MINUTES;
}

function slotToTime(slot: number): string {
  const totalMinutes = DAY_START_HOUR * 60 + slot * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const getMonthName = (m: number) =>
  new Date(2026, m - 1, 1).toLocaleString("default", { month: "long" });

const isOverdue = (task: Task): boolean => {
  if (task.status === "Done" || task.status === "Deferred") return false;
  const ref = task.end_date || task.start_date;
  if (!ref) return false;
  return isBefore(parseISO(ref), new Date()) && !isSameDay(parseISO(ref), new Date());
};

// ─── REAL-TIME INPUT (debounced for text areas) ───────────────────────────────
const RealTimeInput = ({
  value, onSave, className, placeholder,
}: {
  value: string; onSave: (v: string) => void; className: string; placeholder?: string;
}) => {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <input
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onSave(local); }}
      onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
      className={className}
      placeholder={placeholder}
    />
  );
};

// Notes textarea that only saves on blur (not on every keystroke)
const NotesTextarea = ({
  value, onSave, className, placeholder,
}: {
  value: string; onSave: (v: string) => void; className: string; placeholder?: string;
}) => {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <textarea
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onSave(local); }}
      className={className}
      placeholder={placeholder}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function BDApp() {
  // ── auth ──
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ── data ──
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ── navigation ──
  const [activeTab, setActiveTab] = useState<ViewMode>("dashboard");
  const [userScope, setUserScope] = useState<UserScope>("member");

  // ── week navigation ──
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

  // ── calendar ──
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // ── time block ──
  const [timeBlockDate, setTimeBlockDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [timeBlockScope, setTimeBlockScope] = useState<UserScope>("member");
  const [focusedMember, setFocusedMember] = useState<string | null>(null); // "working on" overlay

  // ── modals ──
  const [showForReview, setShowForReview] = useState(false);
  const [enrichTask, setEnrichTask] = useState<Task | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [deferTask, setDeferTask] = useState<Task | null>(null);
  const [deferDate, setDeferDate] = useState("");

  // ── time block add modal ──
  const [showTimeBlockAdd, setShowTimeBlockAdd] = useState(false);
  const [timeBlockForm, setTimeBlockForm] = useState<{
    taskId: string; date: string; start: string; end: string;
  }>({ taskId: "", date: format(new Date(), "yyyy-MM-dd"), start: "09:00", end: "10:00" });

  // ── quick-add form ──
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "", urgency: "Routine", is_colleague_request: false,
    start_date: "", end_date: "", pic: "",
  });

  // ── mobile view ──
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const name = Object.keys(TEAM_EMAILS).find(k => TEAM_EMAILS[k] === session.user.email);
        if (name) setLoggedInUser(name);
      }
    });
  }, []);

  // realtime
  useEffect(() => {
    if (!loggedInUser) return;
    fetchTasks();
    setNewTask(p => ({ ...p, pic: loggedInUser }));

    const ch = supabase
      .channel("rt-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, payload => {
        if (payload.eventType === "INSERT")
          setTasks(p => p.find(t => t.id === payload.new.id) ? p : [...p, payload.new as Task]);
        else if (payload.eventType === "UPDATE") {
          setTasks(p => p.map(t => t.id === payload.new.id ? payload.new as Task : t));
          setEnrichTask(p => p?.id === payload.new.id ? payload.new as Task : p);
        } else if (payload.eventType === "DELETE")
          setTasks(p => p.filter(t => t.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [loggedInUser]);

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginStep) return;
    setIsLoggingIn(true); setLoginError(false);
    const { error } = await supabase.auth.signInWithPassword({
      email: TEAM_EMAILS[loginStep], password: passwordInput,
    });
    if (error) { setLoginError(true); setPasswordInput(""); }
    else { setLoggedInUser(loginStep); setLoginStep(null); setPasswordInput(""); }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setLoggedInUser(null); };

  // ─── DATA ──────────────────────────────────────────────────────────────────
  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*");
    if (data) setTasks(data);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !loggedInUser) return;
    const finalPic = loggedInUser === "Michelle" && newTask.pic ? newTask.pic : loggedInUser;
    const { data, error } = await supabase.from("tasks").insert([{
      ...newTask, pic: finalPic, status: "To Do",
      start_date: newTask.start_date || null,
      end_date: newTask.end_date || null,
    }]).select();
    if (!error && data) {
      setTasks(p => p.find(t => t.id === data[0].id) ? p : [...p, data[0]]);
      setNewTask({ title: "", urgency: "Routine", is_colleague_request: false, start_date: "", end_date: "", notes: "", links: "", pic: loggedInUser });
      setShowQuickAdd(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (updates.start_date === "") updates.start_date = null;
    if (updates.end_date === "") updates.end_date = null;
    setTasks(p => p.map(t => t.id === id ? { ...t, ...updates } : t));
    setEnrichTask(p => p?.id === id ? { ...p!, ...updates } : p);
    await supabase.from("tasks").update(updates).eq("id", id);
  };

  const handleDefer = async () => {
    if (!deferTask || !deferDate) return;
    await updateTask(deferTask.id, { status: "Deferred", end_date: deferDate, start_date: deferDate });
    setDeferTask(null);
    setDeferDate("");
  };

  const addTimeBlock = async () => {
    if (!timeBlockForm.taskId || !timeBlockForm.date) return;
    await updateTask(timeBlockForm.taskId, {
      time_block_date: timeBlockForm.date,
      time_block_start: timeBlockForm.start,
      time_block_end: timeBlockForm.end,
    });
    setShowTimeBlockAdd(false);
  };

  // ─── DERIVED ───────────────────────────────────────────────────────────────
  const today = new Date();
  const baseWeek = addWeeks(today, weekOffset);
  const weekStart = startOfWeek(baseWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5);

  const inWeek = useCallback((t: Task) => {
    if (!t.start_date) return false;
    const s = parseISO(t.start_date), e = parseISO(t.end_date || t.start_date);
    return s <= weekEnd && e >= weekStart;
  }, [weekStart, weekEnd]);

  const visibleTasks = userScope === "team" ? tasks : tasks.filter(t => t.pic === loggedInUser);
  const weekTasks    = visibleTasks.filter(t => inWeek(t) && t.status !== "Deferred");
  const unscheduled  = visibleTasks.filter(t => !t.start_date && t.status !== "Deferred" && t.status !== "Done");

  const overdueCount  = weekTasks.filter(isOverdue).length;
  const doneCount     = weekTasks.filter(t => t.status === "Done").length;
  const forReviewAll  = tasks.filter(t => t.status === "For Review" && (userScope === "team" || t.pic === loggedInUser));

  const urgentTasks   = weekTasks.filter(t => t.urgency === "Urgent"  && t.status !== "Done");
  const routineTasks  = weekTasks.filter(t => t.urgency !== "Urgent"  && t.status !== "Done");
  const doneTasks     = weekTasks.filter(t => t.status === "Done");

  const teamLoad = TEAM_MEMBERS.map(m => ({
    name: m,
    total: tasks.filter(t => t.pic === m && inWeek(t) && t.status !== "Deferred").length,
    done:  tasks.filter(t => t.pic === m && inWeek(t) && t.status === "Done").length,
    tasks: tasks.filter(t => t.pic === m && inWeek(t) && t.status !== "Deferred" && t.status !== "Done"),
  }));

  const isCurrentWeek = weekOffset === 0;

  // ─── "WORKING ON" overlay ──────────────────────────────────────────────────
  const memberCurrentTask = focusedMember
    ? tasks.find(t => t.pic === focusedMember && t.status === "Ongoing") ||
      tasks.find(t => t.pic === focusedMember && t.status === "To Do" && inWeek(t)) ||
      null
    : null;

  // ═══════════════════════════════════════════════════════════════════════════
  //  LOGIN SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (!loggedInUser) {
    return (
      <div className={`flex h-[100dvh] w-full items-center justify-center bg-[#FBFBFD] dark:bg-[#050505] transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
        <AnimatePresence mode="wait">
          {!loginStep ? (
            <motion.div key="sel" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#121214] p-12 rounded-[3rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 text-center max-w-md w-full mx-4">
              <h1 className="text-4xl font-black text-[#04154D] dark:text-white mb-2">BD TEAM</h1>
              <p className="text-[#04154D]/50 dark:text-white/50 mb-10 font-medium">Select your profile to continue</p>
              <div className="space-y-4">
                {TEAM_MEMBERS.map(m => (
                  <button key={m} onClick={() => setLoginStep(m)}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-center gap-3 text-lg font-bold hover:scale-105 ${PIC_COLORS[m].bg} ${PIC_COLORS[m].border} ${PIC_COLORS[m].text}`}>
                    <User size={20} /> Login as {m}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.form key="pw" onSubmit={handleLogin} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#121214] p-12 rounded-[3rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 text-center max-w-md w-full mx-4 relative">
              <button type="button" onClick={() => { setLoginStep(null); setLoginError(false); }}
                className="absolute top-8 left-8 text-[#04154D]/40 hover:text-[#04154D] dark:text-white/40 dark:hover:text-white">
                <ArrowLeft size={24} />
              </button>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center font-black text-3xl mb-6 border ${PIC_COLORS[loginStep].bg} ${PIC_COLORS[loginStep].text} ${PIC_COLORS[loginStep].border}`}>
                {loginStep.charAt(0)}
              </div>
              <h1 className="text-2xl font-black text-[#04154D] dark:text-white mb-2">Welcome back, {loginStep}</h1>
              <p className="text-[#04154D]/50 dark:text-white/50 mb-8 font-medium">Enter your secure password</p>
              <div className="relative mb-8">
                <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-2xl px-6 py-4 text-center text-lg font-bold text-[#04154D] dark:text-white outline-none focus:border-[#2A59FF]/50 transition-colors" />
                {loginError && <p className="absolute -bottom-6 left-0 right-0 text-red-500 text-xs font-bold uppercase tracking-widest">Incorrect Password</p>}
              </div>
              <button type="submit" disabled={isLoggingIn}
                className="w-full p-4 rounded-2xl bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50">
                {isLoggingIn ? "Verifying..." : "Unlock Workspace"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── MOBILE VIEW ──────────────────────────────────────────────────────────
  if (isMobile) {
    return renderMobileView();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TASK ROW
  // ═══════════════════════════════════════════════════════════════════════════
  function TaskRow({ task }: { task: Task }) {
    const overdue = isOverdue(task);
    const isDone  = task.status === "Done";
    const isDeferred = task.status === "Deferred";
    const uColor  = URGENCY_COLORS[task.urgency || "Routine"];
    const ref     = task.end_date || task.start_date;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        onClick={() => setEnrichTask(task)}
        className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all
          ${isDone
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
            onClick={e => {
              e.stopPropagation();
              // If selecting Deferred, open defer modal
            }}
            onChange={e => {
              e.stopPropagation();
              if (e.target.value === "Deferred") {
                setDeferTask(task);
                setDeferDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
              } else {
                updateTask(task.id, { status: e.target.value });
              }
            }}
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  MINI GANTT
  // ═══════════════════════════════════════════════════════════════════════════
  function MiniGantt() {
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
          const clampEnd   = te > weekEnd   ? weekEnd   : te;
          const startCol   = Math.max(0, clampStart.getDay() === 0 ? 4 : clampStart.getDay() - 1);
          const endCol     = Math.min(4, clampEnd.getDay() === 0   ? 4 : clampEnd.getDay() - 1);
          const span       = endCol - startCol + 1;
          const uColor     = URGENCY_COLORS[task.urgency || "Routine"];
          const overdue    = isOverdue(task);

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

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEAM LOAD — per person view
  // ═══════════════════════════════════════════════════════════════════════════
  function TeamLoadSection() {
    const [expandedMember, setExpandedMember] = useState<string | null>(null);

    return (
      <div className="flex flex-col gap-3">
        {teamLoad.map(({ name, total, done, tasks: memberTasks }) => {
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          const isHeavy = total >= 6;
          const isExpanded = expandedMember === name;

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
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] font-semibold text-[#04154D] dark:text-white">{name}</span>
                    <span className={`text-[10px] font-bold ${isHeavy ? "text-[#FF5B24]" : "text-[#04154D]/40 dark:text-white/40"}`}>{done}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-[#04154D]/8 dark:bg-white/8 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${PIC_COLORS[name].bar}`}
                      style={{ width: total === 0 ? "0%" : `${pct}%` }} />
                  </div>
                </div>
                <ChevronRight size={12} className={`text-[#04154D]/20 dark:text-white/20 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {/* Quick "working on" button */}
              <button
                onClick={() => setFocusedMember(name)}
                className={`ml-10 flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all
                  ${PIC_COLORS[name].bg} ${PIC_COLORS[name].border} ${PIC_COLORS[name].text} hover:scale-105`}
              >
                <Eye size={9} /> Working on…
              </button>

              {isExpanded && memberTasks.length > 0 && (
                <div className="ml-10 flex flex-col gap-1.5 mt-1">
                  {memberTasks.slice(0, 4).map(t => (
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  function renderDashboard() {
    const isCurrentWeekView = weekOffset === 0;
    return (
      <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 flex overflow-hidden">

        {/* ── LEFT: TASK COLUMN ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-[#04154D]/5 dark:border-white/5">

          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-8 pt-5 md:pt-7 pb-4 md:pb-5 shrink-0 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-black text-[#04154D] dark:text-white tracking-tight leading-tight">
                  {isCurrentWeekView ? format(today, "EEEE, MMMM do") : "Past / Future Week"}
                </h2>
                {/* Week navigator */}
                <div className="flex items-center gap-1 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-xl px-2 py-1">
                  <button onClick={() => setWeekOffset(p => p - 1)} className="p-1 rounded-lg hover:bg-[#04154D]/5 dark:hover:bg-white/5 transition-colors text-[#04154D] dark:text-white">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setWeekOffset(0)} className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${isCurrentWeekView ? "text-[#2A59FF]" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#2A59FF]"}`}>
                    {isCurrentWeekView ? "This Week" : weekOffset < 0 ? `${Math.abs(weekOffset)}w ago` : `+${weekOffset}w`}
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

          {/* Stat strip */}
          <div className="grid grid-cols-4 gap-2 md:gap-3 px-6 md:px-8 pb-4 md:pb-5 shrink-0">
            {[
              { label: "Done", value: `${doneCount}/${weekTasks.length}`, color: "text-[#2A59FF]", bg: "bg-white dark:bg-[#121214]", border: "border-[#04154D]/10 dark:border-white/10" },
              { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-[#04154D] dark:text-white", bg: overdueCount > 0 ? "bg-red-500/5 dark:bg-red-500/10" : "bg-white dark:bg-[#121214]", border: overdueCount > 0 ? "border-red-500/20" : "border-[#04154D]/10 dark:border-white/10" },
              { label: "For Review", value: forReviewAll.length, color: forReviewAll.length > 0 ? "text-[#FF5B24]" : "text-[#04154D] dark:text-white", bg: forReviewAll.length > 0 ? "bg-[#FF5B24]/5" : "bg-white dark:bg-[#121214]", border: forReviewAll.length > 0 ? "border-[#FF5B24]/20" : "border-[#04154D]/10 dark:border-white/10" },
              { label: "Unscheduled", value: unscheduled.length, color: "text-[#04154D] dark:text-white", bg: "bg-white dark:bg-[#121214]", border: "border-[#04154D]/10 dark:border-white/10" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-3 md:px-4 py-2 md:py-3`}>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 mb-1">{s.label}</p>
                <p className={`text-xl md:text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Task list */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 md:px-8 pb-8 space-y-5">
            {urgentTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Urgent</span>
                  <span className="text-[10px] font-bold text-[#04154D]/25 dark:text-white/25">({urgentTasks.length})</span>
                </div>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>{urgentTasks.map(t => <TaskRow key={t.id} task={t} />)}</AnimatePresence>
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
                  <AnimatePresence>{routineTasks.map(t => <TaskRow key={t.id} task={t} />)}</AnimatePresence>
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
                  <AnimatePresence>{doneTasks.map(t => <TaskRow key={t.id} task={t} />)}</AnimatePresence>
                </div>
              </div>
            )}

            {weekTasks.length === 0 && unscheduled.length === 0 && (
              <div className="text-center py-16 text-[#04154D]/20 dark:text-white/20">
                <Activity size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-black uppercase tracking-widest text-sm">Nothing this week.</p>
              </div>
            )}

            {unscheduled.length > 0 && (
              <div className="pt-5 border-t border-[#04154D]/5 dark:border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={12} className="text-yellow-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">Unscheduled Inbox</span>
                  <span className="text-[10px] font-bold text-[#04154D]/25 dark:text-white/25">({unscheduled.length})</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {unscheduled.map(t => (
                    <div key={t.id} onClick={() => setEnrichTask(t)}
                      className="min-w-[180px] max-w-[220px] p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl cursor-pointer hover:border-yellow-500/50 transition-colors shrink-0">
                      <p className="text-xs font-bold text-[#04154D] dark:text-white truncate mb-1">{t.title}</p>
                      <p className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">Click to schedule →</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-64 lg:w-72 xl:w-80 shrink-0 flex flex-col overflow-hidden bg-[#FBFBFD] dark:bg-[#050505]">
          <div className="p-5 md:p-6 border-b border-[#04154D]/5 dark:border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40">This Week</h3>
              <button onClick={() => setActiveTab("calendar")} className="text-[9px] font-bold text-[#2A59FF] hover:underline uppercase tracking-widest">Full Timeline →</button>
            </div>
            <MiniGantt />
          </div>

          <div className="p-5 md:p-6 border-b border-[#04154D]/5 dark:border-white/5 overflow-y-auto flex-1 no-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40">Team Load</h3>
              <span className="text-[9px] font-bold text-[#04154D]/25 dark:text-white/25 uppercase">Click to expand</span>
            </div>
            <TeamLoadSection />
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  CALENDAR (Gantt)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderCalendar() {
    const monthStart = startOfMonth(new Date(2026, currentMonth - 1));
    const monthEnd   = endOfMonth(monthStart);
    const calDays    = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const weeks: Date[][] = [];
    let wk: Date[] = [];
    calDays.forEach(d => {
      wk.push(d);
      if (getDay(d) === 6 || isSameDay(d, monthEnd)) { weeks.push(wk); wk = []; }
    });

    const onDragStart = (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData("taskId", taskId);
      setDraggingTaskId(taskId);
    };

    const onDrop = (e: React.DragEvent, dropDate: Date) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("taskId");
      setDraggingTaskId(null); setDragOverDate(null);
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
      dir === "left"
        ? updateTask(taskId, { start_date: format(subDays(parseISO(start), 1), "yyyy-MM-dd") })
        : updateTask(taskId, { end_date: format(addDays(parseISO(end), 1), "yyyy-MM-dd") });
    };

    return (
      <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 flex flex-col p-4 md:p-8 overflow-hidden">

        <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0 flex-wrap gap-3">
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
              <p className="text-[9px] text-[#04154D]/25 dark:text-white/25 font-medium mb-4 shrink-0">Drop on any calendar day</p>
              <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar pb-4">
                {unscheduled.length === 0
                  ? <p className="text-xs text-center italic opacity-40 mt-10 text-[#04154D] dark:text-white">All scheduled!</p>
                  : unscheduled.map(t => {
                      const c = URGENCY_COLORS[t.urgency || "Routine"];
                      return (
                        <div key={t.id} draggable
                          onDragStart={e => onDragStart(e, t.id)}
                          onDragEnd={() => { setDraggingTaskId(null); setDragOverDate(null); }}
                          className={`p-3 bg-white dark:bg-[#121214] border rounded-2xl cursor-grab active:cursor-grabbing hover:scale-105 transition-transform select-none ${c.border} ${draggingTaskId === t.id ? "opacity-40" : ""}`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <GripHorizontal size={10} className="text-[#04154D]/20 dark:text-white/20" />
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>{t.urgency || "Routine"}</span>
                          </div>
                          <p className="text-[11px] font-bold text-[#04154D] dark:text-white leading-snug">{t.title}</p>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-2 text-center font-bold text-[#04154D]/25 dark:text-white/25 text-[9px] uppercase tracking-widest shrink-0">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-1.5 min-h-0">
              {weeks.map((week, wIdx) => {
                const wStart = week[0];
                const wEnd   = new Date(week[week.length - 1]); wEnd.setHours(23, 59, 59);

                const wTasks = visibleTasks.filter(t => {
                  if (!t.start_date || t.status === "Deferred") return false;
                  return parseISO(t.start_date) <= wEnd && parseISO(t.end_date || t.start_date) >= wStart;
                });

                return (
                  <div key={wIdx}
                    className="relative w-full border border-[#04154D]/8 dark:border-white/8 rounded-2xl overflow-visible bg-[#FBFBFD] dark:bg-[#121214]"
                    style={{ minHeight: `${Math.max(100, wTasks.length * 34 + 36)}px` }}>

                    <div className="absolute inset-0 grid grid-cols-7 rounded-2xl overflow-hidden">
                      {[0,1,2,3,4,5,6].map(i => {
                        const day = week.find(d => getDay(d) === i);
                        const ds  = day ? format(day, "yyyy-MM-dd") : "";
                        const isDragOver = dragOverDate === ds && ds !== "";
                        const isToday    = day ? isSameDay(day, today) : false;
                        return (
                          <div key={i}
                            onDragOver={day ? e => { e.preventDefault(); setDragOverDate(ds); } : undefined}
                            onDrop={day ? e => onDrop(e, day) : undefined}
                            onDragLeave={() => setDragOverDate(null)}
                            className={`border-r border-[#04154D]/5 dark:border-white/5 last:border-r-0 p-2 transition-colors duration-75
                              ${isToday ? "bg-[#2A59FF]/5" : ""}
                              ${isDragOver ? "bg-[#2A59FF]/10" : ""}
                              ${day && isWeekend(day) && !isDragOver ? "bg-[#04154D]/[0.012] dark:bg-white/[0.012]" : ""}
                            `}>
                            {day && (
                              <span className={`text-[9px] font-bold ${isToday ? "text-[#2A59FF]" : "text-[#04154D]/20 dark:text-white/20"}`}>
                                {format(day, "d")}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute top-7 left-0 right-0 bottom-0 px-1 pointer-events-none">
                      {wTasks.map((task, idx) => {
                        const ts     = parseISO(task.start_date!);
                        const te     = parseISO(task.end_date || task.start_date!);
                        const eStart = ts < wStart ? wStart : ts;
                        const eEnd   = te > wEnd   ? wEnd   : te;
                        const startI = getDay(eStart);
                        const span   = Math.round((eEnd.getTime() - eStart.getTime()) / 86400000) + 1;
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
                            style={{ left: `calc(${(startI / 7) * 100}% + 2px)`, width: `calc(${(span / 7) * 100}% - 4px)`, top: `${idx * 34}px` }}>

                            <button onClick={e => handleExtend(task.id, "left", task.start_date!, task.end_date || task.start_date!, e)}
                              className="absolute -left-3 hidden group-hover:flex items-center justify-center w-5 h-5 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/15 dark:border-white/15 rounded-full shadow-md z-20 hover:scale-125 transition-transform text-[#04154D] dark:text-white cursor-pointer">
                              <ArrowLeft size={9} />
                            </button>

                            <div className="flex items-center gap-1.5 px-3 w-full overflow-hidden">
                              <GripHorizontal size={9} className="opacity-25 shrink-0" />
                              <span className="text-[9px] font-bold truncate flex-1">{task.title}</span>
                              {userScope === "team" && <span className="text-[8px] font-black opacity-40 ml-auto shrink-0">{task.pic.charAt(0)}</span>}
                            </div>

                            <button onClick={e => handleExtend(task.id, "right", task.start_date!, task.end_date || task.start_date!, e)}
                              className="absolute -right-3 hidden group-hover:flex items-center justify-center w-5 h-5 bg-white dark:bg-[#1A1A1D] border border-[#04154D]/15 dark:border-white/15 rounded-full shadow-md z-20 hover:scale-125 transition-transform text-[#04154D] dark:text-white cursor-pointer">
                              <ArrowRight size={9} />
                            </button>
                          </div>
                        );
                      })}
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  TIME BLOCK VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  function renderTimeBlock() {
    const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
    const selectedDateTasks = tasks.filter(t =>
      t.time_block_date === timeBlockDate &&
      (timeBlockScope === "team" || t.pic === loggedInUser)
    );

    const CELL_HEIGHT = 48; // px per 30min slot

    // For team view, column per member
    const members = timeBlockScope === "team" ? TEAM_MEMBERS : [loggedInUser as string];

    return (
      <motion.div key="tb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 pt-5 pb-4 shrink-0 flex-wrap gap-3 border-b border-[#04154D]/5 dark:border-white/5">
          <div>
            <h2 className="text-2xl font-black text-[#04154D] dark:text-white">Time Blocks</h2>
            <p className="text-[#2A59FF] font-bold uppercase tracking-widest text-xs mt-0.5">Daily Schedule — 7:00 AM to 6:30 PM</p>
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
            <button onClick={() => {
              setTimeBlockForm({ taskId: "", date: timeBlockDate, start: "09:00", end: "10:00" });
              setShowTimeBlockAdd(true);
            }}
              className="bg-[#04154D] dark:bg-[#2A59FF] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:scale-105 transition-transform flex items-center gap-2">
              <Timer size={14} /> Add Block
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="flex min-h-full">

            {/* Time labels column */}
            <div className="w-16 shrink-0 border-r border-[#04154D]/5 dark:border-white/5 sticky left-0 bg-[#FBFBFD] dark:bg-[#0A0A0C] z-10">
              <div className="h-10" /> {/* header spacer */}
              {slots.map(i => (
                <div key={i} style={{ height: CELL_HEIGHT }}
                  className="flex items-start justify-end pr-3 pt-1.5 border-b border-[#04154D]/5 dark:border-white/5">
                  {i % 2 === 0 && (
                    <span className="text-[9px] font-bold text-[#04154D]/30 dark:text-white/30 whitespace-nowrap">{slotLabel(i)}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Member columns */}
            {members.map(member => {
              const memberTasks = selectedDateTasks.filter(t => t.pic === member && t.time_block_start && t.time_block_end);
              return (
                <div key={member} className="flex-1 min-w-0 relative border-r border-[#04154D]/5 dark:border-white/5 last:border-r-0">
                  {/* Member header */}
                  <div className={`h-10 flex items-center justify-center border-b border-[#04154D]/5 dark:border-white/5 sticky top-0 z-10 ${PIC_COLORS[member]?.bg || "bg-white dark:bg-[#121214]"}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${PIC_COLORS[member]?.text || ""}`}>{member}</span>
                  </div>

                  {/* Slot rows */}
                  <div className="relative">
                    {slots.map(i => {
                      const nowHour = today.getHours();
                      const nowMin  = today.getMinutes();
                      const slotStartMin = DAY_START_HOUR * 60 + i * SLOT_MINUTES;
                      const nowTotalMin  = nowHour * 60 + nowMin;
                      const isNowSlot    = Math.abs(slotStartMin - nowTotalMin) < SLOT_MINUTES && isSameDay(parseISO(timeBlockDate), today);
                      return (
                        <div key={i} style={{ height: CELL_HEIGHT }}
                          className={`border-b border-[#04154D]/5 dark:border-white/5
                            ${i % 2 === 0 ? "" : "bg-[#04154D]/[0.008] dark:bg-white/[0.008]"}
                            ${isNowSlot ? "bg-[#2A59FF]/5" : ""}
                          `} />
                      );
                    })}

                    {/* Task blocks overlay */}
                    {memberTasks.map(task => {
                      const startSlot = timeToSlot(task.time_block_start!);
                      const endSlot   = timeToSlot(task.time_block_end!);
                      const slotSpan  = Math.max(1, endSlot - startSlot);
                      const top       = startSlot * CELL_HEIGHT;
                      const height    = slotSpan * CELL_HEIGHT - 4;
                      const colors    = PIC_COLORS[task.pic] || PIC_COLORS["Bien"];
                      const uColors   = URGENCY_COLORS[task.urgency || "Routine"];

                      return (
                        <div key={task.id}
                          onClick={() => setEnrichTask(task)}
                          className={`absolute left-1 right-1 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all shadow-sm overflow-hidden
                            ${timeBlockScope === "team" ? `${colors.bg} ${colors.border}` : `${uColors.bg} ${uColors.border}`}`}
                          style={{ top: `${top}px`, height: `${height}px` }}>
                          <div className={`w-1 absolute left-0 top-0 bottom-0 ${timeBlockScope === "team" ? colors.bar : (task.urgency === "Urgent" ? "bg-red-500" : task.urgency === "Scheduled" ? "bg-emerald-500" : "bg-slate-400")}`} />
                          <div className="pl-3 pr-2 pt-1.5 h-full flex flex-col justify-start overflow-hidden">
                            <p className={`text-[10px] font-black leading-tight truncate ${timeBlockScope === "team" ? colors.text : uColors.text}`}>
                              {task.title}
                            </p>
                            <p className="text-[8px] font-bold text-[#04154D]/30 dark:text-white/30 mt-0.5">
                              {slotLabel(startSlot)} – {slotLabel(endSlot)}
                            </p>
                            {task.status === "Ongoing" && (
                              <span className="text-[7px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mt-0.5">● Active</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Current time line */}
                    {isSameDay(parseISO(timeBlockDate), today) && (() => {
                      const nowMin = (today.getHours() - DAY_START_HOUR) * 60 + today.getMinutes();
                      if (nowMin < 0 || nowMin > (DAY_END_HOUR - DAY_START_HOUR) * 60 + SLOT_MINUTES) return null;
                      const top = (nowMin / SLOT_MINUTES) * CELL_HEIGHT;
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
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TIME BLOCK ADD MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  function renderTimeBlockAdd() {
    const availableTasks = tasks.filter(t =>
      (timeBlockScope === "member" ? t.pic === loggedInUser : true) &&
      t.status !== "Done" && t.status !== "Deferred"
    );

    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowTimeBlockAdd(false)}
          className="absolute inset-0 bg-[#04154D]/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer" />
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 p-8 z-10 flex flex-col gap-5">

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#04154D] dark:text-white flex items-center gap-2">
              <Timer size={20} className="text-[#2A59FF]" /> Add Time Block
            </h3>
            <button onClick={() => setShowTimeBlockAdd(false)} className="p-2 rounded-full hover:bg-[#04154D]/5 dark:hover:bg-white/5 text-[#04154D]/40 dark:text-white/40">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-1.5">Select Task</label>
            <select value={timeBlockForm.taskId} onChange={e => setTimeBlockForm(p => ({ ...p, taskId: e.target.value }))}
              className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer">
              <option value="">— choose a task —</option>
              {availableTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.pic})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-1.5">Date</label>
            <input type="date" value={timeBlockForm.date} onChange={e => setTimeBlockForm(p => ({ ...p, date: e.target.value }))}
              className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-1.5">Start Time</label>
              <select value={timeBlockForm.start} onChange={e => setTimeBlockForm(p => ({ ...p, start: e.target.value }))}
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-3 py-3 text-sm font-bold outline-none cursor-pointer">
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                  <option key={i} value={slotToTime(i)}>{slotLabel(i)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-1.5">End Time</label>
              <select value={timeBlockForm.end} onChange={e => setTimeBlockForm(p => ({ ...p, end: e.target.value }))}
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-3 py-3 text-sm font-bold outline-none cursor-pointer">
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                  <option key={i} value={slotToTime(i)}>{slotLabel(i)}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={addTimeBlock} disabled={!timeBlockForm.taskId}
            className="w-full bg-[#04154D] dark:bg-[#2A59FF] text-white font-bold text-sm py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg disabled:opacity-40">
            <Timer size={18} /> Schedule Block
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  "WORKING ON" OVERLAY
  // ═══════════════════════════════════════════════════════════════════════════
  function renderWorkingOnOverlay() {
    if (!focusedMember) return null;
    const colors = PIC_COLORS[focusedMember];
    const currentTask = tasks.find(t => t.pic === focusedMember && t.status === "Ongoing");
    const nextTask    = tasks.find(t => t.pic === focusedMember && t.status === "To Do" && inWeek(t));
    const todayBlocks = tasks.filter(t =>
      t.pic === focusedMember &&
      t.time_block_date === format(today, "yyyy-MM-dd") &&
      t.time_block_start
    ).sort((a, b) => (a.time_block_start! > b.time_block_start! ? 1 : -1));

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setFocusedMember(null)}
          className="absolute inset-0 bg-[#04154D]/70 dark:bg-black/85 backdrop-blur-sm cursor-pointer" />
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 p-8 z-10">

          <button onClick={() => setFocusedMember(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#04154D]/5 dark:hover:bg-white/5 text-[#04154D]/40 dark:text-white/40"><X size={16} /></button>

          {/* Avatar */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-2 mx-auto mb-4 ${colors.bg} ${colors.border} ${colors.text}`}>
            {focusedMember.charAt(0)}
          </div>
          <h2 className="text-center text-xl font-black text-[#04154D] dark:text-white mb-1">{focusedMember}</h2>
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 mb-6">Working On Overview</p>

          {currentTask ? (
            <div className={`p-4 rounded-2xl border mb-4 ${colors.bg} ${colors.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Currently Working On</span>
              </div>
              <p className={`text-sm font-bold ${colors.text}`}>{currentTask.title}</p>
              {currentTask.end_date && (
                <p className="text-[9px] text-[#04154D]/40 dark:text-white/40 mt-1">Due {format(parseISO(currentTask.end_date), "MMM d")}</p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-[#04154D]/10 dark:border-white/10 mb-4 text-center">
              <p className="text-[11px] text-[#04154D]/30 dark:text-white/30 italic">No active task</p>
            </div>
          )}

          {nextTask && (
            <div className="p-3 rounded-xl border border-[#04154D]/8 dark:border-white/8 mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#04154D]/30 dark:text-white/30 mb-1">Up Next</p>
              <p className="text-xs font-bold text-[#04154D] dark:text-white">{nextTask.title}</p>
            </div>
          )}

          {todayBlocks.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#04154D]/30 dark:text-white/30 mb-2">Today's Schedule</p>
              <div className="space-y-2">
                {todayBlocks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2 bg-[#FBFBFD] dark:bg-[#1A1A1D] rounded-xl border border-[#04154D]/5 dark:border-white/5">
                    <Clock size={11} className="text-[#04154D]/30 dark:text-white/30 shrink-0" />
                    <span className="text-[9px] font-bold text-[#04154D]/50 dark:text-white/50 shrink-0">{slotLabel(timeToSlot(t.time_block_start!))} – {slotLabel(timeToSlot(t.time_block_end!))}</span>
                    <span className="text-[10px] font-semibold text-[#04154D] dark:text-white truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUICK ADD MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  function renderQuickAdd() {
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  DEFER MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  function renderDeferModal() {
    if (!deferTask) return null;
    const minDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => { setDeferTask(null); setDeferDate(""); }}
          className="absolute inset-0 bg-[#04154D]/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer" />
        <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 p-8 z-10 flex flex-col gap-5">

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#04154D] dark:text-white">Defer Task</h3>
            <button onClick={() => { setDeferTask(null); setDeferDate(""); }} className="p-2 rounded-full hover:bg-[#04154D]/5 dark:hover:bg-white/5 text-[#04154D]/40 dark:text-white/40"><X size={18} /></button>
          </div>

          <div className="bg-slate-500/5 border border-slate-500/10 rounded-2xl px-4 py-3">
            <p className="text-sm font-bold text-[#04154D] dark:text-white truncate">{deferTask.title}</p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 block mb-2">Defer Until (must be a future date)</label>
            <input type="date" min={minDate} value={deferDate} onChange={e => setDeferDate(e.target.value)}
              className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
            <p className="text-[9px] text-[#04154D]/30 dark:text-white/30 mt-2">The task will be hidden until this date.</p>
          </div>

          <button onClick={handleDefer} disabled={!deferDate}
            className="w-full bg-slate-600 text-white font-bold text-sm py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg disabled:opacity-40">
            <Clock size={18} /> Defer Task
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ENRICH PANEL
  // ═══════════════════════════════════════════════════════════════════════════
  function renderEnrichModal() {
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
            <button onClick={() => setEnrichTask(null)}
              className="p-2 bg-white dark:bg-[#121214] rounded-full hover:scale-110 transition-transform border border-[#04154D]/8 dark:border-white/8 text-[#04154D] dark:text-white">
              <X size={16} />
            </button>
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
                <select value={enrichTask.urgency || "Routine"} onChange={e => updateTask(enrichTask.id, { urgency: e.target.value as any })}
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

            {/* Time block section in enrich */}
            {enrichTask.time_block_date && (
              <div className="bg-[#2A59FF]/5 border border-[#2A59FF]/20 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Timer size={13} className="text-[#2A59FF]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#2A59FF]">Time Blocked</span>
                </div>
                <p className="text-sm font-bold text-[#04154D] dark:text-white">
                  {enrichTask.time_block_date} · {enrichTask.time_block_start ? slotLabel(timeToSlot(enrichTask.time_block_start)) : ""} – {enrichTask.time_block_end ? slotLabel(timeToSlot(enrichTask.time_block_end)) : ""}
                </p>
                <button onClick={() => updateTask(enrichTask.id, { time_block_date: null, time_block_start: null, time_block_end: null })}
                  className="text-[9px] font-bold text-red-500 mt-2 hover:underline">Remove block</button>
              </div>
            )}

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

  // ═══════════════════════════════════════════════════════════════════════════
  //  FOR REVIEW MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  function renderReviews() {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowForReview(false)}
          className="absolute inset-0 bg-[#04154D]/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer" />
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#0A0A0C] rounded-[3rem] shadow-2xl border border-[#04154D]/10 dark:border-white/10 flex flex-col overflow-hidden">
          <div className="bg-[#FF5B24] p-7 flex justify-between items-center text-white shrink-0">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3"><AlertCircle size={26} /> Pending Reviews</h2>
              <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-1">{forReviewAll.length} tasks require approval</p>
            </div>
            <button onClick={() => setShowForReview(false)} className="p-3 hover:bg-white/20 rounded-full transition-colors"><X size={22} /></button>
          </div>
          <div className="p-7 overflow-y-auto flex-1 no-scrollbar bg-[#FBFBFD] dark:bg-[#121214]">
            {forReviewAll.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-[#04154D] dark:text-white">
                <CheckCircle2 size={56} className="mb-4" />
                <p className="font-black text-lg uppercase tracking-widest">All clear!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {forReviewAll.map(task => (
                  <div key={task.id} className="bg-white dark:bg-[#1A1A1D] p-5 rounded-[2rem] border border-[#04154D]/10 dark:border-white/10 flex flex-col hover:border-[#FF5B24]/40 transition-colors min-h-[180px]">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest border ${PIC_COLORS[task.pic]?.bg || ""} ${PIC_COLORS[task.pic]?.text || ""} ${PIC_COLORS[task.pic]?.border || ""}`}>
                        {task.pic}
                      </span>
                      <button onClick={() => { setShowForReview(false); setEnrichTask(task); }}
                        className="p-1.5 bg-[#FBFBFD] dark:bg-[#121214] rounded-lg text-[#04154D]/40 dark:text-white/40 hover:text-[#2A59FF] transition-colors">
                        <Maximize2 size={14} />
                      </button>
                    </div>
                    <h3 className="text-base font-bold text-[#04154D] dark:text-white mb-5 flex-1 leading-snug">{task.title}</h3>
                    <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })}
                      className="w-full font-bold px-4 py-2.5 rounded-xl border border-[#04154D]/10 dark:border-white/10 outline-none text-sm bg-[#FBFBFD] dark:bg-[#121214] text-[#04154D] dark:text-white cursor-pointer hover:border-[#2A59FF]/40 transition-colors">
                      {TASK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MOBILE VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  function renderMobileView() {
    const myTasks = tasks.filter(t => t.pic === loggedInUser && t.status !== "Deferred");
    const myOngoing = myTasks.filter(t => t.status === "Ongoing");
    const myUrgent  = myTasks.filter(t => t.urgency === "Urgent" && t.status !== "Done" && t.status !== "Ongoing");
    const myOverdue = myTasks.filter(isOverdue);
    const myToday   = tasks.filter(t => t.pic === loggedInUser && t.time_block_date === format(today, "yyyy-MM-dd") && t.time_block_start);

    return (
      <div className={`flex flex-col h-[100dvh] w-full overflow-hidden bg-[#050505] text-white ${isDarkMode ? "dark" : ""}`}>
        {/* Top bar */}
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">

          {/* Active task */}
          <div className="bg-[#2A59FF]/10 border border-[#2A59FF]/20 rounded-3xl p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#2A59FF] mb-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2A59FF] animate-pulse" /> Active
            </p>
            {myOngoing.length > 0 ? (
              <div className="space-y-2">
                {myOngoing.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white flex-1 truncate">{t.title}</p>
                    <button onClick={() => updateTask(t.id, { status: "Done" })}
                      className="shrink-0 p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                      <CheckCircle2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30 italic">Nothing active right now</p>
            )}
          </div>

          {/* Overdue alert */}
          {myOverdue.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-red-400">{myOverdue.length} overdue task{myOverdue.length > 1 ? "s" : ""}</p>
                <p className="text-[10px] text-red-400/60">{myOverdue.map(t => t.title).join(", ")}</p>
              </div>
            </div>
          )}

          {/* Today's time blocks */}
          {myToday.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Today's Schedule</p>
              <div className="space-y-2">
                {myToday.sort((a,b) => a.time_block_start! > b.time_block_start! ? 1 : -1).map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                    <Clock size={13} className="text-white/30 shrink-0" />
                    <span className="text-[9px] font-bold text-white/30 shrink-0 tabular-nums">
                      {slotLabel(timeToSlot(t.time_block_start!))}
                    </span>
                    <span className="text-xs font-semibold text-white truncate flex-1">{t.title}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[t.status]?.bg} ${STATUS_COLORS[t.status]?.border} ${STATUS_COLORS[t.status]?.text}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team quick view */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Team Status</p>
            <div className="space-y-2">
              {TEAM_MEMBERS.filter(m => m !== loggedInUser).map(m => {
                const active = tasks.find(t => t.pic === m && t.status === "Ongoing");
                const c = PIC_COLORS[m];
                return (
                  <button key={m} onClick={() => setFocusedMember(m)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] ${c.bg} ${c.border}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border ${c.bg} ${c.border} ${c.text}`}>{m.charAt(0)}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-xs font-bold ${c.text}`}>{m}</p>
                      <p className="text-[9px] text-white/30 truncate">{active ? active.title : "No active task"}</p>
                    </div>
                    <Eye size={13} className="text-white/20 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgent */}
          {myUrgent.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Urgent</p>
              <div className="space-y-2">
                {myUrgent.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs font-semibold text-white flex-1 truncate">{t.title}</span>
                    <select value={t.status} onChange={e => updateTask(t.id, { status: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      className="text-[9px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer bg-transparent text-white border-white/10">
                      {TASK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom FAB */}
        <div className="shrink-0 px-5 pb-safe pb-6 pt-3 border-t border-white/5">
          <button onClick={() => setShowQuickAdd(true)}
            className="w-full bg-[#2A59FF] text-white font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#2A59FF]/30">
            <Plus size={18} /> Quick Add Task
          </button>
        </div>

        {/* Portals */}
        <AnimatePresence>{focusedMember && renderWorkingOnOverlay()}</AnimatePresence>
        <AnimatePresence>{showQuickAdd && renderQuickAdd()}</AnimatePresence>
        <AnimatePresence>{deferTask && renderDeferModal()}</AnimatePresence>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ROOT (desktop/tablet)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`h-[100dvh] w-full overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="flex flex-col h-full w-full bg-[#FBFBFD] dark:bg-[#050505] text-[#04154D] dark:text-[#FBFBFD]">

        {/* ════════════ TOP NAV ════════════ */}
        <header className="shrink-0 h-14 flex items-center justify-between px-4 md:px-6 bg-[#FBFBFD] dark:bg-[#050505] border-b border-[#04154D]/5 dark:border-white/5 z-20">
          <div className="flex items-center gap-4 md:gap-5">
            <span className="text-base font-black tracking-tight text-[#04154D] dark:text-white">BD TEAM</span>
            <div className="w-px h-5 bg-[#04154D]/10 dark:bg-white/10" />
            <nav className="flex items-center gap-1 bg-white dark:bg-[#121214] border border-[#04154D]/8 dark:border-white/8 rounded-xl p-1">
              <button onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "dashboard" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-sm" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
                <LayoutDashboard size={13} /> <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "calendar" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-sm" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
                <CalendarIcon size={13} /> <span className="hidden sm:inline">Timeline</span>
              </button>
              <button onClick={() => setActiveTab("timeblock")}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "timeblock" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-sm" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
                <Timer size={13} /> <span className="hidden sm:inline">Time Blocks</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsDarkMode(p => !p)}
              className="p-2 rounded-xl text-[#04154D]/40 dark:text-white/40 hover:bg-[#04154D]/5 dark:hover:bg-white/5 transition-colors">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="w-px h-5 bg-[#04154D]/10 dark:bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border ${PIC_COLORS[loggedInUser!]?.bg} ${PIC_COLORS[loggedInUser!]?.border} ${PIC_COLORS[loggedInUser!]?.text}`}>
                {loggedInUser!.charAt(0)}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-[#04154D] dark:text-white">{loggedInUser}</span>
              <button onClick={handleLogout} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><LogOut size={14} /></button>
            </div>
          </div>
        </header>

        {/* ════════════ MAIN CANVAS ════════════ */}
        <main className="flex-1 relative min-h-0 overflow-hidden
          bg-white dark:bg-[#0A0A0C]
          rounded-tl-[28px] rounded-tr-[28px]
          border-t border-l border-r border-[#04154D]/8 dark:border-white/8
          shadow-[inset_0_0_24px_rgba(4,21,77,0.03)]">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "calendar" && renderCalendar()}
            {activeTab === "timeblock" && renderTimeBlock()}
          </AnimatePresence>
        </main>
      </div>

      {/* ════════════ PORTALS ════════════ */}
      <AnimatePresence>{enrichTask && renderEnrichModal()}</AnimatePresence>
      <AnimatePresence>{showForReview && renderReviews()}</AnimatePresence>
      <AnimatePresence>{showQuickAdd && renderQuickAdd()}</AnimatePresence>
      <AnimatePresence>{showTimeBlockAdd && renderTimeBlockAdd()}</AnimatePresence>
      <AnimatePresence>{deferTask && renderDeferModal()}</AnimatePresence>
      <AnimatePresence>{focusedMember && renderWorkingOnOverlay()}</AnimatePresence>
    </div>
  );
}
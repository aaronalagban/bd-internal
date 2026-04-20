"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertCircle, X, Plus, Zap, Link2, FileText,
  Users, User, LayoutDashboard, Calendar as CalendarIcon,
  Moon, Sun, ArrowLeft, ArrowRight, Activity, LogOut, Maximize2,
  GripHorizontal, Circle, Clock, ChevronRight
} from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isBefore,
  parseISO, getDay, isWeekend, isSameDay, startOfWeek, endOfWeek, addDays, subDays
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
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TASK_STATES = ["To Do", "Ongoing", "For Review", "Deferred", "Done"];
const TEAM_MEMBERS = ["Bien", "Aaron", "Michelle"];

const TEAM_EMAILS: Record<string, string> = {
  Bien: "josiahsantiago22@gmail.com",
  Aaron: "aaronalagban@gmail.com",
  Michelle: "michelle@bdteam.com",
};

const PIC_COLORS: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  Bien:     { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-700 dark:text-blue-400",     bar: "bg-blue-500" },
  Aaron:    { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-700 dark:text-orange-400", bar: "bg-orange-500" },
  Michelle: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-700 dark:text-purple-400", bar: "bg-purple-500" },
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

const getMonthName = (m: number) =>
  new Date(2026, m - 1, 1).toLocaleString("default", { month: "long" });

const isOverdue = (task: Task): boolean => {
  if (task.status === "Done" || task.status === "Deferred") return false;
  const ref = task.end_date || task.start_date;
  if (!ref) return false;
  return isBefore(parseISO(ref), new Date()) && !isSameDay(parseISO(ref), new Date());
};

// ─── REAL-TIME INPUT ─────────────────────────────────────────────────────────
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar">("dashboard");
  const [userScope, setUserScope] = useState<"member" | "team">("member");

  // ── calendar ──
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // ── modals ──
  const [showForReview, setShowForReview] = useState(false);
  const [enrichTask, setEnrichTask] = useState<Task | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // ── quick-add form ──
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "", urgency: "Routine", is_colleague_request: false,
    start_date: "", end_date: "", pic: "",
  });

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

  // ─── DERIVED ───────────────────────────────────────────────────────────────
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5);

  const inWeek = (t: Task) => {
    if (!t.start_date) return false;
    const s = parseISO(t.start_date), e = parseISO(t.end_date || t.start_date);
    return s <= weekEnd && e >= weekStart;
  };

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
  }));

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
              <Activity size={48} className="mx-auto text-[#2A59FF] mb-6" />
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  TASK ROW — compact list item
  // ═══════════════════════════════════════════════════════════════════════════
  const TaskRow = ({ task }: { task: Task }) => {
    const overdue = isOverdue(task);
    const isDone  = task.status === "Done";
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
            : overdue
              ? "bg-red-500/5 dark:bg-red-500/10 border-red-500/20 hover:border-red-500/40"
              : "bg-white dark:bg-[#1A1A1D] border-[#04154D]/8 dark:border-white/8 hover:border-[#2A59FF]/30 hover:shadow-sm"
          }`}
      >
        {/* Status toggle circle */}
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

        {/* Urgency dot */}
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${uColor.dot}`} />

        {/* Title */}
        <span className={`flex-1 text-sm font-semibold truncate ${isDone ? "line-through text-[#04154D]/40 dark:text-white/40" : "text-[#04154D] dark:text-white"}`}>
          {task.title}
        </span>

        {/* Meta tags */}
        <div className="flex items-center gap-2 shrink-0">
          {overdue && !isDone && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
              Overdue {ref ? format(parseISO(ref), "MMM d") : ""}
            </span>
          )}
          {!overdue && ref && !isDone && (
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
            onClick={e => e.stopPropagation()}
            onChange={e => updateTask(task.id, { status: e.target.value })}
            className={`text-[9px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer transition-colors shrink-0
              ${STATUS_COLORS[task.status]?.bg || ""} ${STATUS_COLORS[task.status]?.border || ""} ${STATUS_COLORS[task.status]?.text || ""}`}
          >
            {TASK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronRight size={14} className="text-[#04154D]/20 dark:text-white/20 group-hover:text-[#2A59FF] transition-colors" />
        </div>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  MINI GANTT (right panel, dashboard only)
  // ═══════════════════════════════════════════════════════════════════════════
  const MiniGantt = () => {
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
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEAM LOAD BARS
  // ═══════════════════════════════════════════════════════════════════════════
  const TeamLoadBars = () => (
    <div className="flex flex-col gap-3">
      {teamLoad.map(({ name, total, done }) => {
        const pct    = total === 0 ? 0 : Math.round((done / total) * 100);
        const isHeavy = total >= 6;
        return (
          <div key={name} className="flex items-center gap-3">
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
          </div>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  const renderDashboard = () => (
    <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex overflow-hidden">

      {/* ── LEFT: TASK COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-[#04154D]/5 dark:border-white/5">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-[#04154D] dark:text-white tracking-tight leading-tight">
              {format(today, "EEEE, MMMM do")}
            </h2>
            <p className="text-[#2A59FF] font-bold uppercase tracking-widest text-xs mt-1">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex bg-[#FBFBFD] dark:bg-[#1A1A1D] p-1.5 rounded-2xl border border-[#04154D]/10 dark:border-white/10 shadow-inner">
            <button onClick={() => setUserScope("member")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "member" ? "bg-[#2A59FF] text-white shadow-md" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
              <User size={14} /> Mine
            </button>
            <button onClick={() => setUserScope("team")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "team" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-md" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
              <Users size={14} /> Team
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3 px-8 pb-5 shrink-0">
          {[
            {
              label: "Done this week",
              value: `${doneCount}/${weekTasks.length}`,
              color: "text-[#2A59FF]",
              bg: "bg-white dark:bg-[#121214]",
              border: "border-[#04154D]/10 dark:border-white/10",
            },
            {
              label: "Overdue",
              value: overdueCount,
              color: overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-[#04154D] dark:text-white",
              bg: overdueCount > 0 ? "bg-red-500/5 dark:bg-red-500/10" : "bg-white dark:bg-[#121214]",
              border: overdueCount > 0 ? "border-red-500/20" : "border-[#04154D]/10 dark:border-white/10",
            },
            {
              label: "For Review",
              value: forReviewAll.length,
              color: forReviewAll.length > 0 ? "text-[#FF5B24]" : "text-[#04154D] dark:text-white",
              bg: forReviewAll.length > 0 ? "bg-[#FF5B24]/5" : "bg-white dark:bg-[#121214]",
              border: forReviewAll.length > 0 ? "border-[#FF5B24]/20" : "border-[#04154D]/10 dark:border-white/10",
            },
            {
              label: "Unscheduled",
              value: unscheduled.length,
              color: "text-[#04154D] dark:text-white",
              bg: "bg-white dark:bg-[#121214]",
              border: "border-[#04154D]/10 dark:border-white/10",
            },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Task list */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-8 pb-8 space-y-5">

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

          {/* Unscheduled inbox strip */}
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
      <div className="w-72 xl:w-80 shrink-0 flex flex-col overflow-hidden bg-[#FBFBFD] dark:bg-[#050505]">

        {/* Mini Gantt */}
        <div className="p-6 border-b border-[#04154D]/5 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40">This Week</h3>
            <button onClick={() => setActiveTab("calendar")}
              className="text-[9px] font-bold text-[#2A59FF] hover:underline uppercase tracking-widest">
              Full Timeline →
            </button>
          </div>
          <MiniGantt />
        </div>

        {/* Team load */}
        <div className="p-6 border-b border-[#04154D]/5 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#04154D]/40 dark:text-white/40">Team Load</h3>
            <span className="text-[9px] font-bold text-[#04154D]/25 dark:text-white/25 uppercase">This week</span>
          </div>
          <TeamLoadBars />
        </div>

        {/* Reviews CTA */}
        <div className="p-6 border-b border-[#04154D]/5 dark:border-white/5">
          <button onClick={() => setShowForReview(true)}
            className="w-full bg-[#FF5B24] rounded-2xl p-4 flex items-center justify-between text-white hover:scale-[1.02] transition-transform shadow-lg shadow-[#FF5B24]/20">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Pending Reviews</p>
              <p className="text-3xl font-black">{forReviewAll.length}</p>
            </div>
            <AlertCircle size={26} className="opacity-60" />
          </button>
        </div>

        {/* Quick add */}
        <div className="p-6">
          <button onClick={() => setShowQuickAdd(true)}
            className="w-full bg-[#04154D] dark:bg-[#2A59FF] text-white font-bold text-sm py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg">
            <Plus size={18} /> Quick Add Task
          </button>
        </div>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  CALENDAR (Gantt)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderCalendar = () => {
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
        className="absolute inset-0 flex flex-col p-6 md:p-8 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0 flex-wrap gap-4">
          <div className="flex bg-[#FBFBFD] dark:bg-[#1A1A1D] p-1.5 rounded-2xl border border-[#04154D]/10 dark:border-white/10 shadow-inner">
            <button onClick={() => setUserScope("member")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "member" ? "bg-[#2A59FF] text-white shadow-md" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
              <User size={14} /> My Map
            </button>
            <button onClick={() => setUserScope("team")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${userScope === "team" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-md" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
              <Users size={14} /> Team Map
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 bg-[#FBFBFD] dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-full shadow-sm">
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

          {/* Month nav */}
          <div className="flex items-center gap-1 bg-[#FBFBFD] dark:bg-[#1A1A1D] border border-[#04154D]/10 dark:border-white/10 rounded-full p-1 shadow-sm">
            <button onClick={() => setCurrentMonth(p => Math.max(1, p - 1))} className="p-2 rounded-full hover:bg-white dark:hover:bg-[#121214] text-[#04154D] dark:text-white transition-colors"><ArrowLeft size={15} /></button>
            <span className="text-xs font-bold uppercase tracking-widest px-4 text-[#04154D] dark:text-white">{getMonthName(currentMonth)} 2026</span>
            <button onClick={() => setCurrentMonth(p => Math.min(12, p + 1))} className="p-2 rounded-full hover:bg-white dark:hover:bg-[#121214] text-[#04154D] dark:text-white transition-colors"><ArrowRight size={15} /></button>
          </div>
        </div>

        <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">

          {/* Unscheduled sidebar */}
          {userScope === "member" && (
            <div className="w-52 flex flex-col bg-[#FBFBFD] dark:bg-[#1A1A1D] rounded-[2rem] border border-[#04154D]/10 dark:border-white/10 p-5 shrink-0 min-h-0">
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

          {/* Gantt grid */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center font-bold text-[#04154D]/25 dark:text-white/25 text-[9px] uppercase tracking-widest shrink-0">
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

                    {/* Drop target columns */}
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

                    {/* Task bars */}
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
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUICK ADD MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  const renderQuickAdd = () => (
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  ENRICH PANEL
  // ═══════════════════════════════════════════════════════════════════════════
  const renderEnrichModal = () => {
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
                <select value={enrichTask.status} onChange={e => updateTask(enrichTask.id, { status: e.target.value })}
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

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 flex items-center gap-2 mb-2">
                <FileText size={13} /> Notes
              </label>
              <textarea value={enrichTask.notes || ""}
                onChange={e => updateTask(enrichTask.id, { notes: e.target.value })}
                placeholder="Type detailed notes here..."
                className="w-full min-h-[140px] bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#04154D] dark:text-white border border-[#04154D]/10 dark:border-white/10 rounded-2xl p-5 text-sm font-medium outline-none resize-y placeholder:text-[#04154D]/25 dark:placeholder:text-white/25" />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#04154D]/40 dark:text-white/40 flex items-center gap-2 mb-2">
                <Link2 size={13} /> Reference Link
              </label>
              <input value={enrichTask.links || ""}
                onChange={e => updateTask(enrichTask.id, { links: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#FBFBFD] dark:bg-[#1A1A1D] text-[#2A59FF] border border-[#04154D]/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none placeholder:text-[#04154D]/25 dark:placeholder:text-white/25" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  FOR REVIEW MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  const renderReviews = () => (
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  ROOT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`h-[100dvh] w-full overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="flex flex-col h-full w-full bg-[#FBFBFD] dark:bg-[#050505] text-[#04154D] dark:text-[#FBFBFD]">

        {/* ════════════ TOP NAV ════════════ */}
        <header className="shrink-0 h-14 flex items-center justify-between px-6 bg-[#FBFBFD] dark:bg-[#050505] border-b border-[#04154D]/5 dark:border-white/5 z-20">
          {/* Brand + nav */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <Activity size={22} className="text-[#2A59FF]" />
              <span className="text-base font-black tracking-tight text-[#04154D] dark:text-white">BD TEAM</span>
            </div>

            <div className="w-px h-5 bg-[#04154D]/10 dark:bg-white/10" />

            <nav className="flex items-center gap-1 bg-white dark:bg-[#121214] border border-[#04154D]/8 dark:border-white/8 rounded-xl p-1">
              <button onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "dashboard" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-sm" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
                <LayoutDashboard size={13} /> Dashboard
              </button>
              <button onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "calendar" ? "bg-[#04154D] dark:bg-white text-white dark:text-[#0A0A0C] shadow-sm" : "text-[#04154D]/50 dark:text-white/50 hover:text-[#04154D] dark:hover:text-white"}`}>
                <CalendarIcon size={13} /> Timeline
              </button>
            </nav>
          </div>

          {/* Right side */}
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
              <span className="text-xs font-bold text-[#04154D] dark:text-white">{loggedInUser}</span>
              <button onClick={handleLogout}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut size={14} />
              </button>
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
          </AnimatePresence>
        </main>
      </div>

      {/* ════════════ PORTALS ════════════ */}
      <AnimatePresence>{enrichTask && renderEnrichModal()}</AnimatePresence>
      <AnimatePresence>{showForReview && renderReviews()}</AnimatePresence>
      <AnimatePresence>{showQuickAdd && renderQuickAdd()}</AnimatePresence>
    </div>
  );
}
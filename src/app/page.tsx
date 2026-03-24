"use client";

import React, { useState } from "react";
import { 
  CalendarDays, CheckCircle2, AlertCircle, ChevronDown, X, 
  TrendingUp, BarChart3, PieChart, Clock, FolderArchive
} from "lucide-react";

// --- 2026 DATE CALCULATOR ---
const getMonthName = (monthIndex: number) => {
  const date = new Date(2026, monthIndex - 1, 1);
  return date.toLocaleString('default', { month: 'long' });
};

const getWeekRange2026 = (monthIndex: number, weekIndex: number) => {
  const year = 2026;
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const startDay = (weekIndex - 1) * 7 + 1;
  let endDay = weekIndex * 7;
  if (weekIndex >= 4) endDay = daysInMonth;

  const startDate = new Date(year, monthIndex - 1, startDay);
  const endDate = new Date(year, monthIndex - 1, endDay);
  
  const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${format(startDate)} - ${format(endDate)}`;
};

// --- FULL DATASET ---
const rawData = [
  { m: 4, w: 1, task: "Q1 2026 PSC & Rightship Overview (Target Submission: 04/14/2026)", pic: "Bien" },
  { m: 4, w: 2, task: "Wilhelmsen Executive Overview (To be started)", pic: "Bien" },
  { m: 4, w: 3, task: "Seacon Overview (To be started)", pic: "Bien" },
  { m: 4, w: 1, task: "BSM Vessel Under Management (Target Submission: 1st week of April)", pic: "Bien" },
  { m: 4, w: 1, task: "Rightship Cost Allocation", pic: "Bien" },
  { m: 4, w: 1, task: "JP Morgan & Competitor Monthly Fleet List Extract", pic: "Bien" },
  { m: 4, w: 4, task: "Newbuilding Monthly Reporting", pic: "Bien" },
  { m: 5, w: 1, task: "BSM Vessel Under Management (Target Submission: 1st week of April)", pic: "Bien" },
  { m: 5, w: 1, task: "Rightship Cost Allocation", pic: "Bien" },
  { m: 5, w: 1, task: "JP Morgan & Competitor Monthly Fleet List Extract", pic: "Bien" },
  { m: 5, w: 2, task: "Benchmarking on", pic: "Bien" },
  { m: 6, w: 1, task: "BSM Vessel Under Management (Target Submission: 1st week of April)", pic: "Bien" },
  { m: 6, w: 1, task: "Rightship Cost Allocation", pic: "Bien" },
  { m: 6, w: 1, task: "JP Morgan & Competitor Monthly Fleet List Extract", pic: "Bien" },
  { m: 6, w: 1, task: "BSM Overview", pic: "Bien" },
  { m: 7, w: 1, task: "BSM Vessel Under Management (Target Submission: 1st week of April)", pic: "Bien" },
  { m: 7, w: 1, task: "Rightship Cost Allocation", pic: "Bien" },
  { m: 7, w: 1, task: "JP Morgan & Competitor Monthly Fleet List Extract", pic: "Bien" },
  { m: 7, w: 2, task: "Anglo Eastern Overview", pic: "Bien" },
  { m: 7, w: 2, task: "Executive Overview", pic: "Bien" },
  { m: 7, w: 3, task: "Columbia Overview", pic: "Bien" },
  { m: 7, w: 3, task: "FML Overview", pic: "Bien" },
  { m: 7, w: 4, task: "Synergy Overview", pic: "Bien" },
  { m: 5, w: 4, task: "Newbuilding Monthly Reporting", pic: "Bien" },
  { m: 6, w: 4, task: "Newbuilding Monthly Reporting", pic: "Bien" },
  { m: 7, w: 4, task: "Newbuilding Monthly Reporting", pic: "Bien" },
  { m: 8, w: 1, task: "BSM Vessel Under Management (Target Submission: 1st week of April)", pic: "Bien" },
  { m: 8, w: 1, task: "Rightship Cost Allocation", pic: "Bien" },
  { m: 8, w: 1, task: "JP Morgan & Competitor Monthly Fleet List Extract", pic: "Bien" },
  { m: 8, w: 2, task: "Seacon Overview", pic: "Bien" },
  { m: 8, w: 2, task: "Executive Overview", pic: "Bien" },
  { m: 8, w: 3, task: "FML Overview", pic: "Bien" },
  { m: 8, w: 4, task: "V. Ships Overview", pic: "Bien" },
  { m: 8, w: 4, task: "Newbuilding Monthly Reporting", pic: "Bien" },
  { m: 9, w: 1, task: "BSM Vessel Under Management (Target Submission: 1st week of April)", pic: "Bien" },
  { m: 9, w: 1, task: "Rightship Cost Allocation", pic: "Bien" },
  { m: 9, w: 1, task: "JP Morgan & Competitor Monthly Fleet List Extract", pic: "Bien" },
  { m: 9, w: 2, task: "OSM-Thome Overview", pic: "Bien" },
  { m: 9, w: 3, task: "Wallem Overview", pic: "Bien" },
  { m: 9, w: 4, task: "Wilhelmsen Overview", pic: "Bien" },
  { m: 9, w: 4, task: "Newbuilding Monthly Reporting", pic: "Bien" },
  { m: 10, w: 1, task: "Q3 2026 PSC & Rightship Overview", pic: "Bien" },
  { m: 10, w: 1, task: "BSM Vessel Under Management (Target Submission: 1st week of April)", pic: "Bien" },
  { m: 10, w: 1, task: "Rightship Cost Allocation", pic: "Bien" },
  { m: 10, w: 1, task: "JP Morgan & Competitor Monthly Fleet List Extract", pic: "Bien" },
  { m: 10, w: 2, task: "Bench Marking", pic: "Bien" },
  { m: 7, w: 1, task: "Q2 2026 PSC & Rightship Overview", pic: "Bien" },
  { m: 4, w: 1, task: "Country Overview: Indonesia (Update)", pic: "Aaron" },
  { m: 4, w: 1, task: "Database Design (Phase 1)", pic: "Aaron" },
  { m: 4, w: 2, task: "Country Overview: Turkey (Update)", pic: "Aaron" },
  { m: 4, w: 2, task: "Database Design (Phase 1)", pic: "Aaron" },
  { m: 4, w: 2, task: "Review of Client Accounts (CRM)", pic: "Aaron" },
  { m: 4, w: 2, task: "Review of Unattended Opportunities (CRM)", pic: "Aaron" },
  { m: 4, w: 3, task: "Country Overview: Vietnam (Update)", pic: "Aaron" },
  { m: 4, w: 3, task: "Database Design (Phase 1)", pic: "Aaron" },
  { m: 4, w: 4, task: "Country Overview: France (New)", pic: "Aaron" },
  { m: 4, w: 4, task: "Database Design (Phase 1)", pic: "Aaron" },
  { m: 5, w: 1, task: "Country Overview: Hong Kong (Update)", pic: "Aaron" },
  { m: 5, w: 1, task: "Database Development/Testing (Phase 1)", pic: "Aaron" },
  { m: 5, w: 2, task: "Country Overview: Middle East (Update)", pic: "Aaron" },
  { m: 5, w: 2, task: "Database Development/Testing (Phase 1)", pic: "Aaron" },
  { m: 5, w: 2, task: "Review of Client Accounts (CRM)", pic: "Aaron" },
  { m: 5, w: 3, task: "Database Design (Phase 2)", pic: "Aaron" },
  { m: 5, w: 4, task: "Country Overview: Sweden (New)", pic: "Aaron" },
  { m: 5, w: 4, task: "Database Design (Phase 2)", pic: "Aaron" },
  { m: 7, w: 1, task: "Country Overview: South Korea (Update)", pic: "Aaron" },
  { m: 7, w: 1, task: "Database Development/Testing (Phase 2)", pic: "Aaron" },
  { m: 7, w: 2, task: "Database Development/Testing (Phase 2)", pic: "Aaron" },
  { m: 7, w: 2, task: "Review of Client Accounts (CRM)", pic: "Aaron" },
  { m: 7, w: 2, task: "Review of Unattended Opportunities (CRM)", pic: "Aaron" },
  { m: 7, w: 3, task: "Country Overview: China (Update)", pic: "Aaron" },
  { m: 7, w: 3, task: "Database Development/Testing (Phase 2)", pic: "Aaron" },
  { m: 7, w: 4, task: "Database Development/Testing (Phase 2)", pic: "Aaron" },
  { m: 8, w: 1, task: "Country Overview: BeNeLux (Update)", pic: "Aaron" },
  { m: 8, w: 1, task: "Process Automation Projects (Country Overviews)", pic: "Aaron" },
  { m: 8, w: 2, task: "Country Overview: Japan (Update)", pic: "Aaron" },
  { m: 8, w: 2, task: "Process Automation Projects (Country Overviews)", pic: "Aaron" },
  { m: 8, w: 2, task: "Review of Client Accounts (CRM)", pic: "Aaron" },
  { m: 8, w: 3, task: "Process Automation Projects (Country Overviews)", pic: "Aaron" },
  { m: 8, w: 4, task: "Process Automation Projects (Country Overviews)", pic: "Aaron" },
  { m: 9, w: 1, task: "Country Overview: Poland (New)", pic: "Aaron" },
  { m: 9, w: 1, task: "Country Overview: Thailand (Update)", pic: "Aaron" },
  { m: 9, w: 1, task: "Process Automation Projects (Country Overviews)", pic: "Aaron" },
  { m: 9, w: 2, task: "Country Overview: Greece (Update)", pic: "Aaron" },
  { m: 9, w: 2, task: "Review of Client Accounts (CRM)", pic: "Aaron" },
  { m: 9, w: 3, task: "Process Automation Projects (Country Overviews)", pic: "Aaron" },
  { m: 9, w: 4, task: "Country Overview: Finland (New)", pic: "Aaron" },
  { m: 9, w: 4, task: "Process Automation Projects (Competitor Overviews)", pic: "Aaron" },
  { m: 10, w: 1, task: "Country Overview: Singapore (Update)", pic: "Aaron" },
  { m: 10, w: 1, task: "Process Automation Projects (Competitor Overviews)", pic: "Aaron" },
  { m: 10, w: 2, task: "Process Automation Projects (Competitor Overviews)", pic: "Aaron" },
  { m: 10, w: 2, task: "Review of Unattended Opportunities (CRM)", pic: "Aaron" },
  { m: 10, w: 2, task: "Review of Unattended Opportunities (CRM)", pic: "Aaron" },
  { m: 10, w: 3, task: "Process Automation Projects (Competitor Overviews)", pic: "Aaron" },
  { m: 10, w: 4, task: "Country Overview: Philippines (New)", pic: "Aaron" },
  { m: 10, w: 4, task: "Process Automation Projects (BSM Fleet/Internal)", pic: "Aaron" },
  { m: 11, w: 1, task: "Country Overview: USA (New)", pic: "Aaron" },
  { m: 11, w: 1, task: "Process Automation Projects (BSM Fleet/Internal)", pic: "Aaron" },
  { m: 11, w: 2, task: "Process Automation Projects (BSM Fleet/Internal)", pic: "Aaron" },
  { m: 11, w: 2, task: "Review of Client Accounts (CRM)", pic: "Aaron" },
  { m: 11, w: 3, task: "Country Overview: Switzerland (New)", pic: "Aaron" },
  { m: 11, w: 3, task: "Process Automation Projects (BSM Fleet/Internal)", pic: "Aaron" },
  { m: 11, w: 4, task: "Process Automation Projects (BSM Fleet/Internal)", pic: "Aaron" },
  { m: 12, w: 1, task: "Country Overview: Italy (New)", pic: "Aaron" },
  { m: 12, w: 2, task: "Country Overview: Malaysia (New)", pic: "Aaron" },
  { m: 12, w: 2, task: "Review of Client Accounts (CRM)", pic: "Aaron" }
].map((item, index) => ({
  id: index + 1,
  ...item,
  q: Math.ceil(item.m / 3),
  status: "To Do" 
}));

export default function FlatDashboard() {
  const [currentMonth, setCurrentMonth] = useState(4);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [tasks, setTasks] = useState(rawData);
  const [showForChecking, setShowForChecking] = useState(false);
  const [expandedDeferred, setExpandedDeferred] = useState<Record<string, boolean>>({});

  const currentQuarter = Math.ceil(currentMonth / 3);
  const teamMembers = ["Bien", "Aaron", "Michelle"];

  // --- METRICS CALCULATION ---
  const annualTotal = tasks.length;
  const quarterlyTotal = tasks.filter(t => t.q === currentQuarter).length;
  const monthlyTotal = tasks.filter(t => t.m === currentMonth).length;

  const activeWeeklyTasks = tasks.filter(t => t.m === currentMonth && t.w === currentWeek && t.status !== "Deferred");
  const weeklyTotal = activeWeeklyTasks.length;
  const doneItems = activeWeeklyTasks.filter(t => t.status === "Done").length;
  const forCheckingItems = activeWeeklyTasks.filter(t => t.status === "For Checking");

  // --- ACTIONS ---
  const updateStatus = (taskId: number, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const toggleDeferred = (member: string) => {
    setExpandedDeferred(prev => ({ ...prev, [member]: !prev[member] }));
  };

  // --- UI HELPERS ---
  const getStatusColor = (status: string) => {
    switch(status) {
      case "To Do": return "bg-slate-50 text-slate-700 border-slate-200";
      case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200";
      case "For Checking": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Deferred": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Done": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 selection:bg-indigo-100 overflow-x-hidden">
      
      {/* GLOBAL CSS FOR ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
      `}} />

      {/* --- MODAL: FOR CHECKING --- */}
      {showForChecking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200">
            <div className="bg-amber-500 p-5 md:p-6 flex justify-between items-center text-white shrink-0">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                <AlertCircle className="w-7 h-7" /> Items Pending Review
              </h2>
              <button onClick={() => setShowForChecking(false)} className="p-2 md:p-3 hover:bg-amber-600 rounded-full transition-all active:scale-95">
                <X className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
              {forCheckingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-400 opacity-50" />
                  <p className="text-lg font-medium">No items pending review this week.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forCheckingItems.map((task) => (
                    <div key={task.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:border-amber-400 transition-colors">
                      <div>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider block mb-3 w-max">
                          PIC: {task.pic}
                        </span>
                        <p className="font-semibold text-slate-800 text-lg leading-snug">{task.task}</p>
                      </div>
                      <select 
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        className={`text-base font-bold px-4 py-3 md:py-2.5 rounded-xl outline-none border cursor-pointer w-full md:w-auto min-h-[44px] shadow-sm focus:ring-2 focus:ring-amber-500/50 transition-all ${getStatusColor(task.status)}`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="For Checking">For Checking</option>
                        <option value="Deferred">Deferred</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-10">
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 animate-fade-up">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <select 
                value={currentMonth} 
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 text-slate-700 text-base rounded-2xl focus:ring-2 focus:ring-indigo-500/50 block px-5 py-2.5 font-bold shadow-sm min-h-[44px] cursor-pointer hover:bg-slate-50 transition-all"
              >
                {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>{getMonthName(m)} 2026</option>
                ))}
              </select>
              <select 
                value={currentWeek} 
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="bg-white border border-slate-200 text-slate-700 text-base rounded-2xl focus:ring-2 focus:ring-indigo-500/50 block px-5 py-2.5 font-bold shadow-sm min-h-[44px] cursor-pointer hover:bg-slate-50 transition-all"
              >
                {[1, 2, 3, 4].map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight pb-1">
              Marine Deliverables
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mt-2 flex items-center gap-2 font-medium">
              <CalendarDays className="w-5 h-5 text-indigo-500" /> 
              {getWeekRange2026(currentMonth, currentWeek)}
            </p>
          </div>
        </header>

        {/* --- TIMELINE METRICS (Annual, Quarterly, Monthly) --- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up delay-100">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Annual '26</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{annualTotal} <span className="text-base font-semibold text-slate-400">Total</span></h3>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Q{currentQuarter} Load</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{quarterlyTotal} <span className="text-base font-semibold text-slate-400">Tasks</span></h3>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{getMonthName(currentMonth)}</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{monthlyTotal} <span className="text-base font-semibold text-slate-400">Tasks</span></h3>
          </div>
          <div className="bg-slate-900 p-5 rounded-3xl shadow-md border border-slate-800 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Week {currentWeek} Active</span>
            </div>
            <h3 className="text-3xl font-black text-white">{weeklyTotal} <span className="text-base font-semibold text-slate-400">Focus</span></h3>
          </div>
        </section>

        {/* --- WEEKLY ACTION HUB --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-fade-up delay-200">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute -right-6 -top-6 p-4 opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
              <CheckCircle2 className="w-48 h-48 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Weekly Progress</p>
            <div className="flex items-end gap-3 mt-2">
              <h3 className="text-5xl md:text-6xl font-black text-emerald-500 tracking-tighter">{doneItems}</h3>
              <span className="text-xl text-slate-400 font-bold mb-2">/ {weeklyTotal} Done</span>
            </div>
            {/* Flat Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mt-6 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${weeklyTotal === 0 ? 0 : (doneItems/weeklyTotal)*100}%` }}
              />
            </div>
          </div>

          <div 
            onClick={() => setShowForChecking(true)}
            className="bg-orange-500 p-6 md:p-8 rounded-[2rem] shadow-md cursor-pointer hover:-translate-y-2 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-bold text-orange-100 uppercase tracking-wider">Pending Checks</p>
                <h3 className="text-5xl md:text-6xl font-black text-white mt-2 tracking-tighter group-hover:scale-105 transition-transform origin-left">
                  {forCheckingItems.length}
                </h3>
              </div>
              <div className="bg-orange-600 p-4 rounded-2xl shadow-inner group-hover:bg-orange-400 transition-colors">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="text-orange-50 text-sm mt-6 font-bold flex items-center gap-2 relative z-10 bg-orange-600 w-max px-4 py-2 rounded-full">
              Tap to review items <ChevronDown className="w-4 h-4" />
            </p>
          </div>
        </section>

        {/* --- TEAM COLUMNS (Bien, Aaron, Michelle) --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-up delay-300">
          {teamMembers.map(member => {
            const memberTasks = activeWeeklyTasks.filter(t => t.pic === member);
            const memberTotal = memberTasks.length;
            const memberDone = memberTasks.filter(t => t.status === "Done").length;
            const progressPct = memberTotal === 0 ? 0 : Math.round((memberDone / memberTotal) * 100);

            // Fetch ALL deferred tasks for this specific user
            const deferredBucket = tasks.filter(t => t.pic === member && t.status === "Deferred");
            const isDeferredExpanded = expandedDeferred[member] || false;

            return (
              <div key={member} className="bg-slate-100 rounded-[2.5rem] p-4 md:p-5 border border-slate-200 flex flex-col h-full shadow-inner">
                
                {/* Column Header */}
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 mb-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-sm border-2 border-white">
                        {member.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{member}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{memberTotal} Active Tasks</p>
                      </div>
                    </div>
                    <span className={`text-lg font-black ${progressPct === 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Active Weekly Tasks */}
                <div className="space-y-4 flex-1">
                  {memberTasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 mb-2 opacity-50" />
                      <p className="font-bold">Inbox Zero</p>
                    </div>
                  ) : (
                    memberTasks.map(task => (
                      <div key={task.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                        <p className="font-semibold text-slate-800 mb-5 text-base leading-snug">{task.task}</p>
                        <div className="relative">
                          <select 
                            value={task.status}
                            onChange={(e) => updateStatus(task.id, e.target.value)}
                            className={`w-full appearance-none text-sm md:text-base font-bold px-4 py-3 md:py-2.5 rounded-xl outline-none border cursor-pointer min-h-[44px] shadow-sm focus:ring-2 focus:ring-indigo-500/50 transition-all ${getStatusColor(task.status)}`}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="For Checking">For Checking</option>
                            <option value="Deferred">Deferred</option>
                            <option value="Done">Done</option>
                          </select>
                          <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-slate-500" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* --- DEFERRED BUCKET --- */}
                {deferredBucket.length > 0 && (
                  <div className="mt-5 bg-purple-50 border border-purple-200 rounded-[2rem] overflow-hidden transition-all duration-500">
                    <button 
                      onClick={() => toggleDeferred(member)}
                      className="w-full flex justify-between items-center p-5 hover:bg-purple-100 transition-colors focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-200 p-2 rounded-xl text-purple-700">
                          <FolderArchive className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-purple-900 tracking-tight">Deferred Bucket</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-purple-200 text-purple-800 text-xs font-black px-3 py-1 rounded-full">
                          {deferredBucket.length}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-purple-500 transition-transform duration-300 ${isDeferredExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    {/* Collapsible Content */}
                    <div className={`transition-all duration-500 ease-in-out ${isDeferredExpanded ? 'max-h-[1000px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      <div className="space-y-3 mt-2">
                        {deferredBucket.map(task => (
                          <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
                            <span className="text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                              From: M{task.m} • W{task.w}
                            </span>
                            <p className="font-semibold text-slate-800 mb-4 text-sm leading-snug">{task.task}</p>
                            <div className="relative">
                              <select 
                                value={task.status}
                                onChange={(e) => updateStatus(task.id, e.target.value)}
                                className={`w-full appearance-none text-sm font-bold px-4 py-2 rounded-xl outline-none border cursor-pointer min-h-[44px] ${getStatusColor(task.status)}`}
                              >
                                <option value="To Do">Move to 'To Do'</option>
                                <option value="In Progress">In Progress</option>
                                <option value="For Checking">For Checking</option>
                                <option value="Deferred">Deferred</option>
                                <option value="Done">Done</option>
                              </select>
                              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-slate-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </section>

      </div>
    </div>
  );
}
import { TeamMember } from "../types";

export const TASK_STATES = ["To Do", "Ongoing", "For Review", "Deferred", "Done"];
export const TEAM_MEMBERS: TeamMember[] = ["Bien", "Aaron", "Michelle"];

export const TEAM_EMAILS: Record<string, string> = {
  Bien: "josiahsantiago22@gmail.com",
  Aaron: "aaronalagban@gmail.com",
  Michelle: "iammichmartinez@gmail.com",
};

export const PIC_COLORS: Record<string, { bg: string; border: string; text: string; bar: string; solid: string }> = {
  Bien:     { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-700 dark:text-blue-400",     bar: "bg-blue-500",   solid: "#3b82f6" },
  Aaron:    { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-700 dark:text-orange-400", bar: "bg-orange-500", solid: "#f97316" },
  Michelle: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-700 dark:text-purple-400", bar: "bg-purple-500", solid: "#a855f7" },
};

export const URGENCY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Urgent:    { bg: "bg-red-500/10 dark:bg-red-500/20",         border: "border-red-500/30",     text: "text-red-700 dark:text-red-400",       dot: "bg-red-500" },
  Routine:   { bg: "bg-slate-500/10 dark:bg-slate-500/20",     border: "border-slate-500/30",   text: "text-slate-700 dark:text-slate-300",   dot: "bg-slate-400" },
  Scheduled: { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
};

export const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "To Do":      { bg: "bg-slate-500/10 dark:bg-slate-500/20",     border: "border-slate-500/20",   text: "text-slate-600 dark:text-slate-400" },
  "Ongoing":    { bg: "bg-blue-500/10 dark:bg-blue-500/20",       border: "border-blue-500/20",     text: "text-blue-700 dark:text-blue-400" },
  "For Review": { bg: "bg-amber-500/10 dark:bg-amber-500/20",     border: "border-amber-500/20",   text: "text-amber-700 dark:text-amber-400" },
  "Deferred":   { bg: "bg-slate-500/5 dark:bg-slate-500/10",      border: "border-slate-500/10",   text: "text-slate-500 dark:text-slate-500" },
  "Done":       { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", border: "border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400" },
};

export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 18;
export const SLOT_MINUTES = 30;
export const TOTAL_SLOTS = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES + 1;

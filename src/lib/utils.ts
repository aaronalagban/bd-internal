import { isBefore, parseISO, isSameDay } from "date-fns";
import { Task } from "../types";
import { DAY_START_HOUR, SLOT_MINUTES } from "../constants";

export function slotLabel(slotIdx: number): string {
  const totalMinutes = DAY_START_HOUR * 60 + slotIdx * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function timeToSlot(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return ((h - DAY_START_HOUR) * 60 + m) / SLOT_MINUTES;
}

export function slotToTime(slot: number): string {
  const totalMinutes = DAY_START_HOUR * 60 + slot * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export const getMonthName = (m: number) =>
  new Date(2026, m - 1, 1).toLocaleString("default", { month: "long" });

export const isOverdue = (task: Task): boolean => {
  if (task.status === "Done" || task.status === "Deferred") return false;
  const ref = task.end_date || task.start_date;
  if (!ref) return false;
  return isBefore(parseISO(ref), new Date()) && !isSameDay(parseISO(ref), new Date());
};

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

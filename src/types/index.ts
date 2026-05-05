export type Task = {
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
  tagged_members?: string[];
};

export type TimeBlock = {
  id: string; // local uuid
  taskId: string;
  date: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
};

export type ViewMode = "dashboard" | "workload" | "calendar" | "timeblock";
export type UserScope = "member" | "team";
export type TeamMember = "Bien" | "Aaron" | "Michelle";

export type TeamLoad = {
  name: string;
  total: number;
  done: number;
  tasks: Task[];
};

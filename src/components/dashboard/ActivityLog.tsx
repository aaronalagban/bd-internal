"use client";

import React from "react";
import { format } from "date-fns";
import { PIC_COLORS } from "../../constants";

export type Activity = {
  id: string;
  member: string;
  action: string;
  taskTitle: string;
  timestamp: string;
};

interface ActivityLogProps {
  activities: Activity[];
}

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <div className="flex flex-col gap-3">
      {activities.length === 0 ? (
        <p className="text-[10px] italic text-[#04154D]/20 dark:text-white/20 text-center py-4">No recent activity</p>
      ) : (
        activities.map(activity => (
          <div key={activity.id} className="flex gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border shrink-0 ${PIC_COLORS[activity.member].bg} ${PIC_COLORS[activity.member].border} ${PIC_COLORS[activity.member].text}`}>
              {activity.member.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] leading-snug">
                <span className="font-bold text-[#04154D] dark:text-white">{activity.member}</span>{" "}
                <span className="text-[#04154D]/60 dark:text-white/60">{activity.action}</span>{" "}
                <span className="font-bold text-[#2A59FF]">{activity.taskTitle}</span>
              </p>
              <p className="text-[8px] font-bold text-[#04154D]/25 dark:text-white/25 uppercase mt-0.5">
                {format(new Date(activity.timestamp), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

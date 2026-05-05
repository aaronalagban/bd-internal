"use client";

import React, { useState, useEffect } from "react";

export const RealTimeInput = ({
  value, onSave, className, placeholder,
}: {
  value: string; onSave: (v: string) => void; className: string; placeholder?: string;
}) => {
  const [local, setLocal] = useState(value);
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

export const NotesTextarea = ({
  value, onSave, className, placeholder,
}: {
  value: string; onSave: (v: string) => void; className: string; placeholder?: string;
}) => {
  const [local, setLocal] = useState(value);
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

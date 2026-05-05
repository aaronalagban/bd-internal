"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ArrowLeft } from "lucide-react";
import { TEAM_MEMBERS, PIC_COLORS } from "../../constants";

interface LoginScreenProps {
  loginStep: string | null;
  setLoginStep: (step: string | null) => void;
  passwordInput: string;
  setPasswordInput: (input: string) => void;
  loginError: boolean;
  setLoginError: (error: boolean) => void;
  isLoggingIn: boolean;
  handleLogin: (e: React.FormEvent) => void;
  isDarkMode: boolean;
}

export function LoginScreen({
  loginStep,
  setLoginStep,
  passwordInput,
  setPasswordInput,
  loginError,
  setLoginError,
  isLoggingIn,
  handleLogin,
  isDarkMode,
}: LoginScreenProps) {
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

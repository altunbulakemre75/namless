"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Pause, RotateCcw, Zap, CheckCircle2 } from "lucide-react";

export default function StudyTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer finished
          finishTimer();
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setIsFinished(false);
    setMinutes(mode === "focus" ? 25 : 5);
    setSeconds(0);
  };

  const finishTimer = () => {
    setIsActive(false);
    setIsFinished(true);
    // Play sound or notification if possible
  };

  const switchMode = (newMode: "focus" | "break") => {
    setMode(newMode);
    setIsActive(false);
    setIsFinished(false);
    setMinutes(newMode === "focus" ? 25 : 5);
    setSeconds(0);
  };

  const progress = mode === "focus" 
    ? ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100
    : ((5 * 60 - (minutes * 60 + seconds)) / (5 * 60)) * 100;

  return (
    <div className="ios-card rounded-squircle p-6 flex flex-col items-center relative overflow-hidden">
      {/* Background glow when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-to-br ${mode === "focus" ? "from-violet-500/10" : "from-emerald-500/10"} to-transparent pointer-events-none`}
          />
        )}
      </AnimatePresence>

      <div className="w-full flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${mode === "focus" ? "text-violet-500" : "text-emerald-500"}`} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/50">
            {mode === "focus" ? "Odak Modu" : "Mola Vakti"}
          </span>
        </div>
        <div className="flex bg-foreground/5 p-1 rounded-full">
           <button 
             onClick={() => switchMode("focus")}
             className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${mode === "focus" ? "bg-background shadow-sm text-foreground" : "text-foreground/40 hover:text-foreground/60"}`}
           >
             ODAK
           </button>
           <button 
             onClick={() => switchMode("break")}
             className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${mode === "break" ? "bg-background shadow-sm text-foreground" : "text-foreground/40 hover:text-foreground/60"}`}
           >
             MOLA
           </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center mb-8">
        {/* Progress Ring */}
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-foreground/5"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            stroke={mode === "focus" ? "var(--ios-blue)" : "#10b981"}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={440}
            animate={{ strokeDashoffset: 440 - (440 * progress) / 100 }}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isFinished ? (
              <motion.div
                key="finished"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <CheckCircle2 className={`w-10 h-10 ${mode === "focus" ? "text-violet-500" : "text-emerald-500"} mb-1`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">BİTTİ!</span>
              </motion.div>
            ) : (
              <motion.div
                key="time"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-baseline"
              >
                <span className="text-4xl font-bold tracking-tighter tabular-nums">
                  {minutes.toString().padStart(2, '0')}
                </span>
                <span className="text-2xl font-bold mx-0.5 opacity-30">:</span>
                <span className="text-4xl font-bold tracking-tighter tabular-nums">
                  {seconds.toString().padStart(2, '0')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10 w-full">
        {!isFinished ? (
          <button
            onClick={toggleTimer}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
              isActive 
                ? "bg-foreground/5 text-foreground hover:bg-foreground/10" 
                : mode === "focus" 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25" 
                  : "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
            }`}
          >
            {isActive ? (
              <><Pause className="w-4 h-4 fill-current" /> Durdur</>
            ) : (
              <><Play className="w-4 h-4 fill-current ml-0.5" /> Başlat</>
            )}
          </button>
        ) : (
          <button
            onClick={() => switchMode(mode === "focus" ? "break" : "focus")}
            className="flex-1 bg-foreground text-background py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
          >
            {mode === "focus" ? "Molaya Geç" : "Çalışmaya Dön"}
          </button>
        )}
        
        <button
          onClick={resetTimer}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-foreground/5 text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all"
          title="Sıfırla"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {mode === "focus" && isActive && (
        <p className="mt-4 text-[10px] subheadline flex items-center gap-1.5 font-bold uppercase tracking-widest">
           <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Odaklanma Zamanı...
        </p>
      )}
    </div>
  );
}

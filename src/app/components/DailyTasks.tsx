"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Zap, ArrowRight, Brain, BookMarked, Calculator } from "lucide-react";

interface Task {
  id: string;
  label: string;
  completed: boolean;
  type: "question" | "review" | "lesson";
  icon: any;
  points: number;
}

export default function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", label: "20 Üslü Sayılar sorusu çöz", completed: false, type: "question", icon: Calculator, points: 50 },
    { id: "2", label: "Hata Defteri'ndeki son 5 soruyu incele", completed: false, type: "review", icon: Brain, points: 30 },
    { id: "3", label: "Fen Bilimleri - Mevsimler konusunu oku", completed: true, type: "lesson", icon: BookMarked, points: 40 },
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalPoints = tasks.reduce((s, t) => s + (t.completed ? t.points : 0), 0);

  return (
    <div className="ios-card rounded-squircle p-6 overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold tracking-tight mb-0.5">Günlük Görevler</h3>
          <p className="subheadline text-xs">{completedCount}/{tasks.length} Görev Tamamlandı</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold text-[11px] tracking-tight border border-yellow-500/20">
          <Zap className="w-3.5 h-3.5 fill-current" />
          {totalPoints} PUAN
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {tasks.map((task) => (
          <motion.div 
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`group flex items-center gap-4 p-3.5 rounded-2xl border transition-all cursor-pointer ${
              task.completed 
                ? "bg-foreground/[0.02] border-foreground/5 opacity-60" 
                : "bg-background border-foreground/10 hover:border-violet-500/30 hover:shadow-md"
            }`}
          >
            <div className={`shrink-0 transition-all ${task.completed ? "text-emerald-500" : "text-foreground/20 group-hover:text-foreground/40"}`}>
              {task.completed ? <CheckCircle2 className="w-5 h-5 fill-current bg-white rounded-full" /> : <Circle className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
               <p className={`text-sm font-semibold tracking-tight leading-tight ${task.completed ? "line-through" : "text-foreground"}`}>
                 {task.label}
               </p>
               <div className="flex items-center gap-2 mt-1">
                 <task.icon className="w-3 h-3 text-foreground/40" />
                 <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">
                   {task.type === "question" ? "Soru Çözümü" : task.type === "review" ? "Analiz" : "Konu Çalışması"}
                 </span>
               </div>
            </div>

            <div className={`text-[10px] font-bold ${task.completed ? "text-emerald-500" : "text-foreground/30"}`}>
               +{task.points}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative h-1 w-full bg-foreground/5 rounded-full overflow-hidden mb-6">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
           className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--ios-blue)] to-violet-400"
         />
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-foreground/5 text-foreground/70 font-bold text-xs hover:bg-foreground/10 transition-all active:scale-95">
        Daha Fazla Görev Gör <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

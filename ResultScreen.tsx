"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  Cpu,
  LayoutGrid,
  MousePointerClick,
  Quote,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";

import type { JudgeResponse } from "@/lib/types";
import Leaderboard from "./Leaderboard";

function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const CONFETTI_COLORS = ["#fbbf24", "#e879f9", "#a78bfa", "#34d399", "#60a5fa"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.1,
        duration: 2.8 + Math.random() * 2.4,
        size: 6 + Math.random() * 9,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drift: -60 + Math.random() * 120,
        rotate: Math.random() * 360,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: "-6vh", opacity: 1, rotate: p.rotate }}
          animate={{ x: p.drift, y: "112vh", rotate: p.rotate + 240 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size * 0.62,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

function StatBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-500">
          {label.toUpperCase()}
        </span>
        <span className="font-display text-sm font-bold tabular-nums text-zinc-100">
          {value}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
        />
      </div>
    </div>
  );
}

type Props = {
  data: JudgeResponse;
  textTitle: string;
  onRetry: () => void;
  onPickOther: () => void;
  refreshKey: number;
};

export default function ResultScreen({ data, textTitle, onRetry, onPickOther, refreshKey }: Props) {
  const shown = useCountUp(data.score);

  const tone =
    data.exact || data.score === 100
      ? "gold"
      : data.score >= 80
        ? "green"
        : data.score >= 55
          ? "amber"
          : "red";

  const scoreClass =
    tone === "gold"
      ? "text-gradient-gold drop-shadow-[0_0_30px_rgba(251,191,36,0.35)]"
      : tone === "green"
        ? "text-emerald-300"
        : tone === "amber"
          ? "text-amber-300"
          : "text-rose-400";

  const originalWords = useMemo(() => data.original.split(/\s+/), [data.original]);
  const attemptWords = useMemo(() => data.attempt.split(/\s+/), [data.attempt]);

  return (
    <div className="relative flex flex-col gap-14">
      {data.exact && <Confetti />}

      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 pt-8 text-center">
        {/* badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[10px] tracking-[0.16em] text-violet-300">
            {data.judgedBy === "ai" ? (
              <Bot className="h-3.5 w-3.5" strokeWidth={2.2} />
            ) : (
              <Cpu className="h-3.5 w-3.5" strokeWidth={2.2} />
            )}
            {data.judgedBy === "ai" ? "ОЦЕНКА ИИ-СУДЬИ" : "ЛОКАЛЬНАЯ ОЦЕНКА"}
          </span>
          <span className="glass rounded-full px-3.5 py-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-400">
            {textTitle.toUpperCase()}
          </span>
          <span className="glass rounded-full px-3.5 py-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-400">
            МЕСТО #{data.rank} В ТАБЛИЦЕ
          </span>
        </motion.div>

        {/* score */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="flex items-baseline gap-2"
          >
            <span
              className={`font-display text-[6rem] leading-none font-black tabular-nums sm:text-[7.5rem] ${scoreClass}`}
            >
              {shown}
            </span>
            <span className="font-display text-2xl font-semibold text-zinc-600">/100</span>
          </motion.div>

          {data.exact && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1.5"
            >
              <Sparkles className="h-4 w-4 text-amber-300" strokeWidth={2.2} />
              <span className="font-mono text-[11px] tracking-[0.2em] text-amber-200">
                ОДИН В ОДИН С ОРИГИНАЛОМ
              </span>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="font-display text-xl font-bold text-white sm:text-2xl"
          >
            {data.verdict}
          </motion.p>
        </div>

        {/* AI feedback */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="glass relative w-full rounded-2xl p-6 text-left"
        >
          <Quote className="absolute -top-3 left-6 h-6 w-6 text-fuchsia-400/70" strokeWidth={2.4} />
          <p className="text-[15px] leading-relaxed text-zinc-300">{data.feedback}</p>
        </motion.div>

        {/* stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="grid w-full grid-cols-2 gap-3"
        >
          <StatBar label="слова на своих местах" value={data.stats.positionAccuracy} delay={1.1} />
          <StatBar label="сохранённый порядок" value={data.stats.orderAccuracy} delay={1.25} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.15 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] text-zinc-400">
            <Timer className="h-3.5 w-3.5" strokeWidth={2.2} />
            {formatTime(data.stats.timeMs)}
          </span>
          <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] text-zinc-400">
            <MousePointerClick className="h-3.5 w-3.5" strokeWidth={2.2} />
            ХОДОВ: {data.stats.moves}
          </span>
        </motion.div>

        {/* comparison */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className={`grid w-full gap-3 text-left ${data.exact ? "" : "sm:grid-cols-2"}`}
        >
          <div className="glass rounded-2xl p-5">
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.4} />
              ОРИГИНАЛ
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">{data.original}</p>
          </div>
          {!data.exact && (
            <div className="glass rounded-2xl p-5">
              <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
                ТВОЯ СБОРКА
              </p>
              <p className="text-sm leading-relaxed">
                {attemptWords.map((word, i) => (
                  <span
                    key={i}
                    className={
                      word === originalWords[i]
                        ? "text-emerald-300"
                        : "text-rose-400/90"
                    }
                  >
                    {word}
                    {i < attemptWords.length - 1 ? " " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}
        </motion.div>

        {/* actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-fuchsia-600 px-7 py-3.5 font-display text-[13px] font-bold tracking-[0.08em] text-white shadow-xl shadow-fuchsia-500/30 transition hover:brightness-110"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
            ИГРАТЬ ЕЩЁ
          </button>
          <button
            type="button"
            onClick={onPickOther}
            className="glass flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold text-zinc-200 transition hover:text-white"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2.2} />
            Выбрать текст
          </button>
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <Leaderboard refreshKey={refreshKey} />
      </motion.div>
    </div>
  );
}

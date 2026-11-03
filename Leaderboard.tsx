"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Ghost, Sparkles, Trophy } from "lucide-react";

import type { LeaderboardRow } from "@/lib/types";

function formatTime(ms: number | null): string {
  if (ms == null || ms <= 0) return "—";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function rankClass(rank: number): string {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-amber-600";
  return "text-zinc-600";
}

export default function Leaderboard({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d: { rows: LeaderboardRow[] }) => {
        if (!cancelled) setRows(d.rows);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10">
            <Trophy className="h-4 w-4 text-amber-300" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold tracking-[0.18em] text-white">
              ТАБЛИЦА РЕКОРДОВ
            </h2>
            <p className="font-mono text-[10px] tracking-[0.14em] text-zinc-500">
              ЛУЧШИЕ СБОРКИ ВСЕХ ИГРОКОВ
            </p>
          </div>
        </div>
        {rows && rows.length > 0 && rows[0].exact && (
          <div className="hidden items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 sm:flex">
            <Crown className="h-3.5 w-3.5 text-amber-300" strokeWidth={2.4} />
            <span className="font-mono text-[10px] tracking-[0.12em] text-amber-200">
              ЛИДЕР
            </span>
          </div>
        )}
      </div>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-12 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-10 text-center">
          <Ghost className="h-7 w-7 text-zinc-600" strokeWidth={1.8} />
          <p className="text-sm text-zinc-500">
            Пока пусто. Собери текст — и стань первым в таблице.
          </p>
        </div>
      ) : (
        <ol className="space-y-1.5">
          <AnimatePresence initial={false}>
            {rows.map((row, i) => (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:gap-4 ${
                  i === 0
                    ? "border-amber-300/20 bg-amber-300/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-center font-display text-sm font-bold ${rankClass(i + 1)}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {row.playerName}
                  </p>
                  <p className="truncate font-mono text-[10px] tracking-wide text-zinc-500">
                    {row.textTitle} · {formatTime(row.timeMs)}
                  </p>
                </div>
                {row.exact && (
                  <span className="hidden items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 sm:flex">
                    <Sparkles className="h-3 w-3 text-amber-300" strokeWidth={2.4} />
                    <span className="font-mono text-[9px] tracking-[0.14em] text-amber-200">
                      1 В 1
                    </span>
                  </span>
                )}
                <span
                  className={`shrink-0 font-display text-base font-bold tabular-nums ${
                    i === 0 ? "text-gradient-gold" : "text-zinc-200"
                  }`}
                >
                  {row.score}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}

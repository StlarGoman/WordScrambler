"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Loader2,
  MousePointerClick,
  Play,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

import type { Difficulty } from "@/lib/text";
import type { TextMeta } from "@/lib/types";
import Leaderboard from "./Leaderboard";

const DIFFICULTY: Record<
  Difficulty,
  { label: string; chip: string; dot: string }
> = {
  easy: {
    label: "Лёгкий",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  medium: {
    label: "Средний",
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
  hard: {
    label: "Сложный",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    dot: "bg-rose-400",
  },
};

const STEPS = [
  {
    icon: Bot,
    num: "01",
    title: "ИИ перемешивает",
    desc: "Слова заготовленного текста разлетаются в случайном порядке.",
  },
  {
    icon: MousePointerClick,
    num: "02",
    title: "Ты собираешь",
    desc: "Возвращай слова на места кликом или перетаскиванием.",
  },
  {
    icon: Sparkles,
    num: "03",
    title: "ИИ оценивает",
    desc: "Судья сверяет с оригиналом: чем точнее порядок, тем выше балл.",
  },
];

type Props = {
  texts: TextMeta[] | null;
  playerName: string;
  onChangeName: (name: string) => void;
  onPlay: (text: TextMeta) => void;
  onTextsChanged: () => void;
  refreshKey: number;
};

export default function SelectScreen({
  texts,
  playerName,
  onChangeName,
  onPlay,
  onTextsChanged,
  refreshKey,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const formValid =
    title.trim().length >= 3 && wordCount >= 6 && wordCount <= 80 && !busy;

  async function addText() {
    if (!formValid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
      setTitle("");
      setContent("");
      setFormOpen(false);
      onTextsChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-14">
      {/* HERO */}
      <section className="flex flex-col items-center gap-7 pt-8 text-center sm:pt-14">
        <div className="glass flex items-center gap-2 rounded-full px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-fuchsia-400" />
          <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-400">
            ГОЛОВОЛОМКА · СУДЬЯ — ИИ
          </span>
        </div>

        <h1 className="font-display text-[clamp(2.8rem,8.5vw,5.6rem)] leading-[1.04] font-extrabold tracking-tight">
          <span className="block text-zinc-100">ПЕРЕ</span>
          <span className="text-gradient block">СБОРКА</span>
        </h1>

        <p className="max-w-xl text-balance text-[15px] leading-relaxed text-zinc-400 sm:text-base">
          ИИ перемешал слова заготовленного текста. Собери его обратно — чем
          точнее порядок, тем больше очков. Совпадение один в один приносит{" "}
          <span className="font-semibold text-amber-300">идеальные 100</span>.
        </p>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              className="glass rounded-2xl p-4 text-left"
            >
              <div className="mb-3 flex items-center justify-between">
                <step.icon className="h-4.5 w-4.5 text-violet-300" strokeWidth={2} />
                <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600">
                  {step.num}
                </span>
              </div>
              <p className="mb-1 text-sm font-semibold text-zinc-100">{step.title}</p>
              <p className="text-xs leading-relaxed text-zinc-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEXT PICKER */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-wide text-white sm:text-2xl">
              Выбери текст
            </h2>
            <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-zinc-500">
              {texts ? `${texts.length} ТЕКСТОВ ЖДУТ ПЕРЕМЕШИВАНИЯ` : "ЗАГРУЖАЮ…"}
            </p>
          </div>
          <label className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-500">
              ТВОЁ ИМЯ
            </span>
            <input
              value={playerName}
              onChange={(e) => onChangeName(e.target.value.slice(0, 24))}
              placeholder="Игрок"
              className="glass w-44 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {texts === null ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer h-44 rounded-2xl bg-white/[0.03]" />
            ))
          ) : (
            <>
              {texts.map((text, i) => {
                const diff = DIFFICULTY[text.difficulty];
                return (
                  <motion.button
                    key={text.id}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPlay(text)}
                    className="group glass flex flex-col gap-3 rounded-2xl p-5 text-left transition-colors hover:border-violet-400/35"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] ${diff.chip}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
                        {diff.label.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-600">
                        {text.wordCount} СЛОВ
                      </span>
                    </div>
                    <p className="font-display text-[15px] font-semibold leading-snug text-white">
                      {text.title}
                    </p>
                    <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-zinc-500">
                      {text.excerpt}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-sm font-medium text-violet-300 opacity-80 transition group-hover:opacity-100">
                      <Play className="h-4 w-4" strokeWidth={2.2} />
                      Собирать
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.2} />
                    </div>
                  </motion.button>
                );
              })}

              {/* ADD CUSTOM TEXT */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: texts.length * 0.05, duration: 0.4 }}
                className={`rounded-2xl border-2 border-dashed transition-colors ${
                  formOpen
                    ? "glass border-violet-400/30 md:col-span-2 xl:col-span-1"
                    : "border-white/12 hover:border-violet-400/30"
                }`}
              >
                {!formOpen ? (
                  <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-3 p-5 text-zinc-500 transition hover:text-violet-300"
                  >
                    <Plus className="h-6 w-6" strokeWidth={2} />
                    <span className="text-sm font-medium">Добавить свой текст</span>
                    <span className="font-mono text-[10px] tracking-[0.12em]">
                      6–80 СЛОВ
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xs font-semibold tracking-[0.16em] text-white">
                        СВОЙ ТЕКСТ
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormOpen(false)}
                        className="rounded-lg p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                        aria-label="Закрыть"
                      >
                        <X className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                      placeholder="Название текста"
                      className="glass rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
                    />
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value.slice(0, 1200))}
                      placeholder="Текст, который ИИ перемешает…"
                      rows={4}
                      className="glass resize-none rounded-xl px-4 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
                    />
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-[10px] tracking-[0.12em] ${
                          wordCount >= 6 && wordCount <= 80
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                      >
                        СЛОВ: {wordCount} / 6–80
                      </span>
                      <button
                        type="button"
                        onClick={addText}
                        disabled={!formValid}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
                        ) : (
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                        )}
                        Добавить
                      </button>
                    </div>
                    {error && (
                      <p className="text-xs text-rose-400">{error}</p>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </section>

      <Leaderboard refreshKey={refreshKey} />
    </div>
  );
}

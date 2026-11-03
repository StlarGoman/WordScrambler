"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Check,
  Loader2,
  MousePointerClick,
  RotateCcw,
  Shuffle,
  Sparkles,
  Timer,
} from "lucide-react";

import type { Difficulty } from "@/lib/text";
import type { JudgeResponse, StartGameResponse, TextMeta } from "@/lib/types";

type Chip = { uid: number; word: string };

const DIFF_LABEL: Record<Difficulty, { label: string; chip: string }> = {
  easy: { label: "ЛЁГКИЙ", chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" },
  medium: { label: "СРЕДНИЙ", chip: "border-amber-400/25 bg-amber-400/10 text-amber-300" },
  hard: { label: "СЛОЖНЫЙ", chip: "border-rose-400/25 bg-rose-400/10 text-rose-300" },
};

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const chipSpring = { type: "spring", stiffness: 520, damping: 34 } as const;

function PoolChip({ chip, onPick }: { chip: Chip; onPick: (c: Chip) => void }) {
  return (
    <motion.button
      type="button"
      layout
      layoutId={`chip-${chip.uid}`}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: -8 }}
      transition={chipSpring}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => onPick(chip)}
      className="cursor-pointer touch-none rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2 text-[15px] font-medium leading-none text-zinc-200 backdrop-blur-sm transition-colors hover:border-violet-400/50 hover:bg-violet-400/15 hover:text-white"
    >
      {chip.word}
    </motion.button>
  );
}

function AnswerChip({ chip, onBack }: { chip: Chip; onBack: (c: Chip) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chip.uid });

  return (
    <motion.div
      layout
      layoutId={`chip-${chip.uid}`}
      initial={{ opacity: 0, scale: 0.6, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: 10 }}
      transition={chipSpring}
      className={isDragging ? "z-30" : undefined}
    >
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          touchAction: "none",
        }}
        {...attributes}
        {...listeners}
        onClick={() => {
          if (!isDragging) onBack(chip);
        }}
        className={`cursor-grab rounded-xl border px-3.5 py-2 text-[15px] font-medium leading-none text-white backdrop-blur-sm transition-colors ${
          isDragging
            ? "border-fuchsia-400/60 bg-fuchsia-500/30 shadow-xl shadow-fuchsia-500/30"
            : "border-violet-400/40 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 hover:border-rose-400/50"
        }`}
        title="Перетащи, чтобы переставить · клик — вернуть в пул"
      >
        {chip.word}
      </div>
    </motion.div>
  );
}

type Props = {
  meta: TextMeta;
  playerName: string;
  onExit: () => void;
  onFinished: (data: JudgeResponse) => void;
};

export default function PlayScreen({ meta, playerName, onExit, onFinished }: Props) {
  const [game, setGame] = useState<StartGameResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pool, setPool] = useState<Chip[]>([]);
  const [answer, setAnswer] = useState<Chip[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeUid, setActiveUid] = useState<number | null>(null);

  const startRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const total = game?.wordCount ?? 0;

  const load = useCallback(async () => {
    setLoadError(null);
    setGame(null);
    setPool([]);
    setAnswer([]);
    setMoves(0);
    setElapsedMs(0);
    setRunning(false);
    setSubmitError(null);
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId: meta.id }),
      });
      const data = (await res.json()) as StartGameResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Не удалось начать игру");
      setGame(data);
      setPool(data.words.map((word, uid) => ({ uid, word })));
      setRunning(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Не удалось начать игру");
    }
  }, [meta.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsedMs;
    const timer = window.setInterval(
      () => setElapsedMs(performance.now() - startRef.current),
      250,
    );
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const moveToAnswer = useCallback((chip: Chip) => {
    setPool((p) => p.filter((c) => c.uid !== chip.uid));
    setAnswer((a) => [...a, chip]);
    setMoves((m) => m + 1);
  }, []);

  const moveToPool = useCallback((chip: Chip) => {
    setAnswer((a) => a.filter((c) => c.uid !== chip.uid));
    setPool((p) => [...p, chip]);
    setMoves((m) => m + 1);
  }, []);

  const reshufflePool = useCallback(() => {
    setPool((p) => {
      const arr = [...p];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  }, []);

  const resetAll = useCallback(() => {
    if (!game) return;
    setAnswer([]);
    setPool(game.words.map((word, uid) => ({ uid, word })));
  }, [game]);

  const onDragStart = (event: DragStartEvent) => {
    setActiveUid(Number(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveUid(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setAnswer((items) => {
      const from = items.findIndex((c) => c.uid === active.id);
      const to = items.findIndex((c) => c.uid === over.id);
      if (from === -1 || to === -1) return items;
      return arrayMove(items, from, to);
    });
    setMoves((m) => m + 1);
  };

  const activeChip = useMemo(
    () => answer.find((c) => c.uid === activeUid) ?? null,
    [answer, activeUid],
  );

  async function submit() {
    if (!game || submitting || answer.length !== total) return;
    setSubmitting(true);
    setRunning(false);
    setSubmitError(null);
    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textId: meta.id,
          words: answer.map((c) => c.word),
          playerName,
          timeMs: Math.round(elapsedMs),
          moves,
        }),
      });
      const data = (await res.json()) as JudgeResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Не удалось оценить сборку");
      onFinished(data);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Не удалось оценить сборку");
      setSubmitting(false);
      setRunning(true);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 pt-24 text-center">
        <p className="font-display text-lg font-semibold text-white">Что-то пошло не так</p>
        <p className="text-sm text-zinc-500">{loadError}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onExit}
            className="glass rounded-xl px-5 py-2.5 text-sm text-zinc-300 transition hover:text-white"
          >
            К текстам
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 pt-24">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 animate-pulse-soft text-violet-300" strokeWidth={2} />
          <p className="font-display text-sm font-semibold tracking-[0.2em] text-white">
            ИИ ПЕРЕМЕШИВАЕТ СЛОВА…
          </p>
        </div>
        <div className="flex max-w-xl flex-wrap items-center justify-center gap-2">
          {Array.from({ length: Math.max(8, Math.min(meta.wordCount, 24)) }).map((_, i) => (
            <div
              key={i}
              className="shimmer h-9 rounded-xl bg-white/[0.05]"
              style={{ width: 48 + ((i * 37) % 64) }}
            />
          ))}
        </div>
      </div>
    );
  }

  const diff = DIFF_LABEL[game.difficulty];

  return (
    <LayoutGroup>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 pt-4">
        {/* HUD */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            type="button"
            onClick={onExit}
            className="glass flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
            Тексты
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-white sm:text-base">
              {game.title}
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] ${diff.chip}`}
          >
            {diff.label}
          </span>
          <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.1em] text-violet-300">
            {game.shuffledBy === "ai" ? (
              <Bot className="h-3 w-3" strokeWidth={2.4} />
            ) : (
              <Shuffle className="h-3 w-3" strokeWidth={2.4} />
            )}
            {game.shuffledBy === "ai" ? "ПЕРЕМЕШАНО ИИ" : "ПЕРЕМЕШАНО ЛОКАЛЬНО"}
          </span>
          <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] text-zinc-300">
            <Timer className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2.2} />
            {formatTime(elapsedMs)}
          </span>
          <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] text-zinc-300">
            <MousePointerClick className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2.2} />
            {moves}
          </span>
        </div>

        {/* ASSEMBLY LINE */}
        <section className="glass rounded-3xl p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.22em] text-zinc-500">
              ЛИНИЯ СБОРКИ
            </p>
            <p
              className={`font-mono text-[11px] tabular-nums ${
                answer.length === total ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {answer.length} / {total}
            </p>
          </div>
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveUid(null)}
          >
            <SortableContext
              items={answer.map((c) => c.uid)}
              strategy={rectSortingStrategy}
            >
              <div className="flex min-h-28 flex-wrap content-start items-start gap-2 rounded-2xl">
                <AnimatePresence mode="popLayout">
                  {answer.map((chip) => (
                    <AnswerChip key={chip.uid} chip={chip} onBack={moveToPool} />
                  ))}
                </AnimatePresence>
                {answer.length === 0 && (
                  <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 py-9 text-center">
                    <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                      Линия пуста. Нажимай на слова внизу — или перетаскивай
                      уже собранные, чтобы менять порядок.
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeChip ? (
                <div className="scale-105 cursor-grabbing rounded-xl border border-fuchsia-400/70 bg-fuchsia-500/40 px-3.5 py-2 text-[15px] font-medium leading-none text-white shadow-2xl shadow-fuchsia-500/40 backdrop-blur-sm">
                  {activeChip.word}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </section>

        {/* WORD POOL */}
        <section className="glass rounded-3xl p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.22em] text-zinc-500">
              ИСХОДНЫЕ СЛОВА
            </p>
            <p className="font-mono text-[10px] tracking-[0.14em] text-zinc-600">
              КЛИК — НА ЛИНИЮ
            </p>
          </div>
          <div className="flex min-h-16 flex-wrap content-start items-start gap-2">
            <AnimatePresence mode="popLayout">
              {pool.map((chip) => (
                <PoolChip key={chip.uid} chip={chip} onPick={moveToAnswer} />
              ))}
            </AnimatePresence>
            {pool.length === 0 && (
              <div className="flex w-full items-center justify-center gap-2 py-4 text-sm text-emerald-300/90">
                <Check className="h-4 w-4" strokeWidth={2.4} />
                Все слова на линии сборки — можно проверять!
              </div>
            )}
          </div>
        </section>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetAll}
            disabled={submitting || answer.length === 0}
            className="glass flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-zinc-300 transition enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
            Сбросить
          </button>
          <button
            type="button"
            onClick={reshufflePool}
            disabled={submitting || pool.length < 2}
            className="glass flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-zinc-300 transition enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Shuffle className="h-4 w-4" strokeWidth={2.2} />
            Перетасовать пул
          </button>
          <div className="flex-1" />
          <motion.button
            type="button"
            onClick={submit}
            disabled={submitting || answer.length !== total}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-fuchsia-600 px-6 py-3 font-display text-[13px] font-bold tracking-[0.08em] text-white shadow-xl shadow-fuchsia-500/30 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
            )}
            ПРОВЕРИТЬ СБОРКУ
            <span className="rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] tabular-nums">
              {answer.length}/{total}
            </span>
          </motion.button>
        </div>

        {submitError && (
          <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            {submitError}
          </p>
        )}
      </div>

      {/* JUDGING OVERLAY */}
      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="glass flex flex-col items-center gap-5 rounded-3xl px-12 py-10"
            >
              <Sparkles
                className="h-9 w-9 animate-pulse-soft text-fuchsia-300"
                strokeWidth={1.8}
              />
              <p className="font-display text-sm font-bold tracking-[0.22em] text-white">
                ИИ ОЦЕНИВАЕТ СБОРКУ
              </p>
              <div className="shimmer h-1 w-52 overflow-hidden rounded-full bg-white/10" />
              <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-500">
                СУДЬЯ СВЕРЯЕТ КАЖДОЕ СЛОВО С ОРИГИНАЛОМ
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

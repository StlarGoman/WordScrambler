"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { JudgeResponse, TextMeta } from "@/lib/types";
import PlayScreen from "./PlayScreen";
import ResultScreen from "./ResultScreen";
import SelectScreen from "./SelectScreen";

type Screen =
  | { name: "select" }
  | { name: "play"; text: TextMeta; session: number }
  | { name: "result"; text: TextMeta; data: JudgeResponse };

const screenMotion = {
  initial: { opacity: 0, y: 28, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -18, filter: "blur(6px)" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

export default function GameRoot() {
  const [screen, setScreen] = useState<Screen>({ name: "select" });
  const [texts, setTexts] = useState<TextMeta[] | null>(null);
  const [playerName, setPlayerName] = useState("Игрок");
  const [boardKey, setBoardKey] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("peresborka-name");
    if (saved) setPlayerName(saved);
  }, []);

  const changeName = useCallback((name: string) => {
    setPlayerName(name);
    window.localStorage.setItem("peresborka-name", name);
  }, []);

  const loadTexts = useCallback(async () => {
    try {
      const res = await fetch("/api/texts", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { texts: TextMeta[] };
      setTexts(data.texts);
    } catch {
      setTexts([]);
    }
  }, []);

  useEffect(() => {
    loadTexts();
  }, [loadTexts]);

  const startGame = useCallback((text: TextMeta) => {
    setScreen({ name: "play", text, session: Date.now() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const finishGame = useCallback((text: TextMeta, data: JudgeResponse) => {
    setScreen({ name: "result", text, data });
    setBoardKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="relative pb-14">
      <AnimatePresence mode="wait">
        {screen.name === "select" && (
          <motion.div key="select" {...screenMotion}>
            <SelectScreen
              texts={texts}
              playerName={playerName}
              onChangeName={changeName}
              onPlay={startGame}
              onTextsChanged={loadTexts}
              refreshKey={boardKey}
            />
          </motion.div>
        )}

        {screen.name === "play" && (
          <motion.div key={`play-${screen.session}`} {...screenMotion}>
            <PlayScreen
              meta={screen.text}
              playerName={playerName}
              onExit={() => setScreen({ name: "select" })}
              onFinished={(data) => finishGame(screen.text, data)}
            />
          </motion.div>
        )}

        {screen.name === "result" && (
          <motion.div key="result" {...screenMotion}>
            <ResultScreen
              data={screen.data}
              textTitle={screen.text.title}
              onRetry={() => startGame(screen.text)}
              onPickOther={() => setScreen({ name: "select" })}
              refreshKey={boardKey}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

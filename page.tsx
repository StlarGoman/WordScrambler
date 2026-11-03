import { Layers, Zap } from "lucide-react";

import Background from "@/components/Background";
import GameRoot from "@/components/game/GameRoot";

export default function Home() {
  return (
    <>
      <Background />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-fuchsia-500/25">
              <Layers className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <p className="font-display text-[13px] font-semibold tracking-[0.28em] text-white">
                ПЕРЕСБОРКА
              </p>
              <p className="font-mono text-[10px] tracking-[0.14em] text-zinc-500">
                СОБЕРИ ТЕКСТ · ИИ СУДИТ
              </p>
            </div>
          </div>
          <div className="glass hidden items-center gap-2 rounded-full px-4 py-1.5 sm:flex">
            <Zap className="h-3.5 w-3.5 text-amber-300" strokeWidth={2.4} />
            <span className="font-mono text-[11px] tracking-[0.12em] text-zinc-400">
              МОЗГ ИГРЫ: LLAMA НА GROQ
            </span>
          </div>
        </header>

        <GameRoot />

        <footer className="mt-auto flex items-center justify-between py-6 text-[11px] text-zinc-600">
          <span className="font-mono tracking-[0.14em]">ПЕРЕСБОРКА · 2026</span>
          <span className="font-mono tracking-[0.14em]">
            ОЦЕНКА 0–100 · 100 = ОДИН В ОДИН
          </span>
        </footer>
      </div>
    </>
  );
}

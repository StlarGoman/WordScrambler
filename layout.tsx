import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800", "900"],
  variable: "--font-unbounded",
});

const bodyFont = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "Пересборка — собери текст, который перемешал ИИ",
  description:
    "ИИ перемешивает слова заготовленного текста, ты собираешь его обратно, а ИИ-судья оценивает сборку от 0 до 100. Совпадение один в один — идеальный результат.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${bodyFont.variable} ${mono.variable}`}
    >
      <body className="bg-[#07070c] font-body text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}

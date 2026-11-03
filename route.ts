import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { texts, type TextRow } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { countWords, difficultyForWords, tokenizeText } from "@/lib/text";
import type { TextMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

function toMeta(row: TextRow): TextMeta {
  const wordCount = countWords(row.content);
  const excerpt =
    row.content.length > 110
      ? `${row.content.slice(0, 110).trimEnd()}…`
      : row.content;
  return {
    id: row.id,
    title: row.title,
    difficulty: row.difficulty as TextMeta["difficulty"],
    wordCount,
    excerpt,
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db.select().from(texts).orderBy(asc(texts.id));
    return NextResponse.json({ texts: rows.map(toMeta) });
  } catch (error) {
    console.error("GET /api/texts", error);
    return NextResponse.json(
      { error: "Не удалось загрузить тексты" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: unknown; content?: unknown };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const wordCount = countWords(content);

    if (title.length < 3 || title.length > 120) {
      return NextResponse.json(
        { error: "Название должно быть от 3 до 120 символов" },
        { status: 400 },
      );
    }
    if (wordCount < 6 || wordCount > 80) {
      return NextResponse.json(
        { error: "Текст должен содержать от 6 до 80 слов" },
        { status: 400 },
      );
    }
    if (tokenizeText(content).some((w) => w.length > 40)) {
      return NextResponse.json(
        { error: "Слишком длинные слова в тексте" },
        { status: 400 },
      );
    }

    await ensureSeeded();
    const [row] = await db
      .insert(texts)
      .values({ title, content, difficulty: difficultyForWords(wordCount) })
      .returning();
    return NextResponse.json({ text: toMeta(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/texts", error);
    return NextResponse.json(
      { error: "Не удалось сохранить текст" },
      { status: 500 },
    );
  }
}

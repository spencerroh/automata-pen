import { NextResponse } from "next/server";
import { callModel, parseJsonWithRetry } from "@/lib/openai";
import { directionsRequestSchema, directionsResponseSchema } from "@/lib/schemas";
import { getPrompts } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = directionsRequestSchema.parse(body);
    const prompts = getPrompts(parsed.prompts);

    const prompt = prompts.directionPrompt
      .replace("{genre}", parsed.genre)
      .replace("{theme}", parsed.theme);

    const raw = await callModel(prompt);
    const json = await parseJsonWithRetry<unknown>(raw, "directions");
    const validated = directionsResponseSchema.parse(json);

    return NextResponse.json(validated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}

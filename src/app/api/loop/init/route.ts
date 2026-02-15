import { NextResponse } from "next/server";
import { getPrompts } from "@/lib/prompts";
import { callModel, parseJsonWithRetry } from "@/lib/openai";
import { getPhaseForRound, maxRewriteOrdersByRound } from "@/lib/loop";
import { loopInitRequestSchema, loopStateSchema } from "@/lib/schemas";

const roundOneSchema = loopStateSchema.pick({
  logline: true,
  outline: true,
  draft: true,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loopInitRequestSchema.parse(body);
    const prompts = getPrompts(parsed.prompts);
    const direction = parsed.directions.find((d) => d.id === parsed.pickedDirectionId);

    if (!direction) {
      return NextResponse.json({ error: "Invalid selected direction" }, { status: 400 });
    }

    const prompt = prompts.draftPrompt
      .replace("{genre}", parsed.genre)
      .replace("{theme}", parsed.theme)
      .replace("{direction}", JSON.stringify(direction))
      .replace("{twist}", parsed.twist);

    const raw = await callModel(prompt);
    const roundOne = roundOneSchema.parse(await parseJsonWithRetry<unknown>(raw, "round one draft"));

    const state = loopStateSchema.parse({
      id: crypto.randomUUID(),
      genre: parsed.genre,
      theme: parsed.theme,
      pickedDirectionId: parsed.pickedDirectionId,
      direction,
      roundsTotal: parsed.rounds,
      roundNow: 1,
      editMode: parsed.editMode,
      twist: parsed.twist,
      phase: getPhaseForRound(1, parsed.rounds, parsed.editMode),
      constraints: {
        lengthMin: 1500,
        lengthMax: 2000,
        maxRewriteOrders: maxRewriteOrdersByRound(2),
        coreFixed: {
          protagonist: `${parsed.theme}를 좇는 인물`,
          desire: `${parsed.theme}를 이루려는 욕망`,
          obstacle: direction.conflict,
          coreEvent: direction.hook,
          symbolicObject: "상징 오브젝트",
        },
      },
      logline: roundOne.logline,
      outline: roundOne.outline,
      draft: roundOne.draft,
      history: [{ round: 1, phase: "draft", changeLog: ["초안 생성 완료"] }],
      done: false,
    });

    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}

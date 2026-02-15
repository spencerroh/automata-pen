import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrompts } from "@/lib/prompts";
import { callModel, parseJsonWithRetry } from "@/lib/openai";
import { getPhaseForRound, maxRewriteOrdersByRound } from "@/lib/loop";
import { critiqueSchema, loopStateSchema, loopStepRequestSchema } from "@/lib/schemas";

const reviseSchema = z.object({
  draft: z.string(),
  changeLog: z.array(z.string()).default([]),
});

const finalizerSchema = z.object({
  final: z.string(),
  titles: z.array(z.string()).length(5),
  tagline: z.array(z.string()).length(3),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loopStepRequestSchema.parse(body);
    const prompts = getPrompts(parsed.prompts);
    const current = parsed.state;

    if (current.done || current.roundNow >= current.roundsTotal) {
      return NextResponse.json({ state: current });
    }

    const nextRound = current.roundNow + 1;
    const nextPhase = getPhaseForRound(nextRound, current.roundsTotal, current.editMode);
    const maxRewriteOrders = maxRewriteOrdersByRound(nextRound);
    const constraints = {
      ...current.constraints,
      maxRewriteOrders,
    };
    const constraintsJson = JSON.stringify(constraints, null, 2);

    if (nextPhase === "finalize") {
      const finalCriticPrompt = prompts.finalCriticPrompt
        .replace("{constraintsJson}", constraintsJson)
        .replace("{draft}", current.draft);
      const criticRaw = await callModel(finalCriticPrompt);
      const critic = critiqueSchema.parse(await parseJsonWithRetry<unknown>(criticRaw, "final critique"));
      critic.rewriteOrders = critic.rewriteOrders.slice(0, maxRewriteOrders);

      const finalizerPrompt = prompts.finalizerPrompt
        .replace("{direction}", JSON.stringify(current.direction))
        .replace("{constraintsJson}", constraintsJson)
        .replace("{draft}", current.draft)
        .replace("{critiqueJson}", JSON.stringify(critic));
      const finalRaw = await callModel(finalizerPrompt);
      const finalized = finalizerSchema.parse(await parseJsonWithRetry<unknown>(finalRaw, "finalizer output"));

      const state = loopStateSchema.parse({
        ...current,
        roundNow: nextRound,
        phase: nextPhase,
        constraints,
        draft: finalized.final,
        history: [...current.history, { round: nextRound, phase: nextPhase, critic }],
        final: {
          titles: finalized.titles,
          taglines: finalized.tagline,
          story: finalized.final,
        },
        done: true,
      });

      return NextResponse.json({ state });
    }

    const criticTemplate = nextPhase === "structure" ? prompts.criticStructurePrompt : prompts.criticProsePrompt;
    const reviseTemplate = nextPhase === "structure" ? prompts.reviseStructurePrompt : prompts.reviseProsePrompt;

    const criticPrompt = criticTemplate
      .replace("{constraintsJson}", constraintsJson)
      .replace("{draft}", current.draft)
      .replace("{maxRewriteOrders}", String(maxRewriteOrders));

    const criticRaw = await callModel(criticPrompt);
    const critic = critiqueSchema.parse(await parseJsonWithRetry<unknown>(criticRaw, "critique"));
    critic.rewriteOrders = critic.rewriteOrders.slice(0, maxRewriteOrders);

    const revisePrompt = reviseTemplate
      .replace("{constraintsJson}", constraintsJson)
      .replace("{draft}", current.draft)
      .replace("{critiqueJson}", JSON.stringify(critic));
    const reviseRaw = await callModel(revisePrompt);
    const revised = reviseSchema.parse(await parseJsonWithRetry<unknown>(reviseRaw, "revision output"));

    const state = loopStateSchema.parse({
      ...current,
      roundNow: nextRound,
      phase: nextPhase,
      constraints,
      draft: revised.draft,
      history: [...current.history, { round: nextRound, phase: nextPhase, critic, changeLog: revised.changeLog }],
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

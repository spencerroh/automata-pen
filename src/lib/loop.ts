import { LoopState } from "@/lib/schemas";

export function getPhaseForRound(round: number, total: number, editMode: LoopState["editMode"]): LoopState["phase"] {
  if (round === 1) return "draft";
  if (round === total) return "finalize";
  if (round === 2) return "structure";
  if (editMode === "구조") return "structure";
  if (editMode === "문장") return "prose";
  return round % 2 === 1 ? "prose" : "structure";
}

export function maxRewriteOrdersByRound(round: number): number {
  return round <= 5 ? 5 : 3;
}

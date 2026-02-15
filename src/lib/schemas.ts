import { z } from "zod";

export const directionIdSchema = z.enum(["A", "B", "C"]);
export const styleSchema = z.enum(["담담", "서정", "유머", "건조"]);

export const directionSchema = z.object({
  id: directionIdSchema,
  hook: z.string().min(1),
  conflict: z.string().min(1),
  endingMood: z.string().min(1),
  style: styleSchema,
});

export const promptOverridesSchema = z.object({
  directionPrompt: z.string().optional(),
  draftPrompt: z.string().optional(),
  criticStructurePrompt: z.string().optional(),
  criticProsePrompt: z.string().optional(),
  reviseStructurePrompt: z.string().optional(),
  reviseProsePrompt: z.string().optional(),
  finalCriticPrompt: z.string().optional(),
  finalizerPrompt: z.string().optional(),
});

export const editModeSchema = z.enum(["균형", "구조", "문장"]);
export const twistSchema = z.enum(["약", "중", "강"]);
export const phaseSchema = z.enum(["draft", "structure", "prose", "finalize"]);

export const critiqueSchema = z.object({
  issues: z.array(z.object({ where: z.string(), why: z.string() })).max(7),
  rewriteOrders: z.array(z.string()),
  priorities: z.array(z.string()).max(3),
  scorecard: z.array(z.object({ item: z.string(), score: z.union([z.literal(0), z.literal(1), z.literal(2)]) })),
});

export const loopStateSchema = z.object({
  id: z.string().min(1),
  genre: z.string().min(1),
  theme: z.string().min(1),
  pickedDirectionId: directionIdSchema,
  direction: directionSchema,
  roundsTotal: z.number().int().min(2).max(10),
  roundNow: z.number().int().min(1).max(10),
  editMode: editModeSchema,
  twist: twistSchema,
  phase: phaseSchema,
  constraints: z.object({
    lengthMin: z.number().int().positive(),
    lengthMax: z.number().int().positive(),
    maxRewriteOrders: z.number().int().positive(),
    coreFixed: z.object({
      protagonist: z.string(),
      desire: z.string(),
      obstacle: z.string(),
      coreEvent: z.string(),
      symbolicObject: z.string(),
    }),
  }),
  logline: z.string(),
  outline: z.array(z.object({ scene: z.number().int().positive(), beat: z.string() })),
  draft: z.string(),
  history: z.array(
    z.object({
      round: z.number().int().positive(),
      phase: z.string(),
      critic: critiqueSchema.optional(),
      changeLog: z.array(z.string()).optional(),
    }),
  ),
  final: z
    .object({
      titles: z.array(z.string()).length(5),
      taglines: z.array(z.string()).length(3),
      story: z.string(),
    })
    .optional(),
  done: z.boolean(),
});

export const directionsRequestSchema = z.object({
  genre: z.string().min(1),
  theme: z.string().min(1),
  prompts: promptOverridesSchema.optional(),
});

export const directionsResponseSchema = z.object({
  directions: z.array(directionSchema).length(3),
});

export const loopInitRequestSchema = z.object({
  genre: z.string().min(1),
  theme: z.string().min(1),
  pickedDirectionId: directionIdSchema,
  directions: z.array(directionSchema).length(3),
  rounds: z.number().int().min(2).max(10),
  twist: twistSchema,
  editMode: editModeSchema,
  prompts: promptOverridesSchema.optional(),
});

export const loopStepRequestSchema = z.object({
  state: loopStateSchema,
  prompts: promptOverridesSchema.optional(),
});

export type Direction = z.infer<typeof directionSchema>;
export type PromptOverrides = z.infer<typeof promptOverridesSchema>;
export type Critique = z.infer<typeof critiqueSchema>;
export type LoopState = z.infer<typeof loopStateSchema>;

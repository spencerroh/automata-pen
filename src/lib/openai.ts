import OpenAI from "openai";
import { OPENAI_MODEL } from "@/lib/config";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callModel(prompt: string): Promise<string> {
  const response = await client.responses.create({
    model: OPENAI_MODEL,
    input: prompt,
  });

  return response.output_text;
}

export async function parseJsonWithRetry<T>(raw: string, schemaName: string): Promise<T> {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fixed = await callModel(
      `아래 텍스트를 ${schemaName} 스키마에 맞는 유효한 JSON으로만 복구해. 설명 금지, 코드펜스 금지.\\n\\n${raw}`,
    );
    return JSON.parse(fixed) as T;
  }
}

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export type ResearchProvider = "openai" | "anthropic";

export interface ResearchSource {
  url: string;
  title: string;
}

export interface ResearchResult {
  summary: string;
  imagePrompt: string;
  sources: ResearchSource[];
  provider: ResearchProvider;
  model: string;
}

const SYSTEM_INSTRUCTIONS = `You research visual subjects on the web and write a detailed prompt for an image-generation model.

Your task: given a user's brief (e.g. "make a wrap based on a Japanese police car"), use the web_search tool to look up authoritative references for the subject. Pay attention to colors, livery, typography, distinctive markings, materials, and overall composition. Then produce TWO things:

1. A short SUMMARY (2-4 sentences) of the visual elements you observed.
2. A detailed IMAGE_PROMPT optimized for a tile-friendly Tesla wrap. The wrap is mapped onto the body of a Tesla Model 3, so:
   - Favor seamless, edge-to-edge designs that read well at multiple scales.
   - Be explicit about colors (hex if you can), livery layout, key motifs, and typography.
   - Avoid composition that requires perfect alignment to specific car panels.
   - Don't include people or other vehicles in the design unless they are stylized graphics.
   - Don't include the words "Tesla" or "Model 3" in the image prompt.

Return ONLY a JSON object on a single line, no markdown fences:
{"summary":"...","imagePrompt":"..."}`;

export async function research(
  userBrief: string,
  provider: ResearchProvider
): Promise<ResearchResult> {
  if (provider === "anthropic") return researchAnthropic(userBrief);
  return researchOpenAI(userBrief);
}

async function researchOpenAI(userBrief: string): Promise<ResearchResult> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_RESEARCH_MODEL ?? "gpt-4.1";

  const response = await client.responses.create({
    model,
    instructions: SYSTEM_INSTRUCTIONS,
    input: userBrief,
    tools: [{ type: "web_search" } as never],
  });

  const text = (response as { output_text?: string }).output_text ?? "";
  const sources: ResearchSource[] = [];
  const output = (response as { output?: unknown[] }).output ?? [];
  for (const item of output) {
    const it = item as { type?: string; content?: unknown[] };
    if (it.type !== "message") continue;
    for (const c of it.content ?? []) {
      const cc = c as { annotations?: unknown[] };
      for (const a of cc.annotations ?? []) {
        const aa = a as { type?: string; url?: string; title?: string };
        if (aa.type === "url_citation" && aa.url) {
          sources.push({ url: aa.url, title: aa.title ?? aa.url });
        }
      }
    }
  }

  const parsed = parseJson(text);
  return {
    summary: parsed.summary,
    imagePrompt: parsed.imagePrompt,
    sources: dedupeSources(sources),
    provider: "openai",
    model,
  };
}

async function researchAnthropic(userBrief: string): Promise<ResearchResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_RESEARCH_MODEL ?? "claude-opus-4-7";

  const response = await client.messages.create({
    model,
    max_tokens: 1500,
    system: SYSTEM_INSTRUCTIONS,
    messages: [{ role: "user", content: userBrief }],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      } as never,
    ],
  });

  let text = "";
  const sources: ResearchSource[] = [];
  for (const block of response.content) {
    const b = block as {
      type?: string;
      text?: string;
      citations?: Array<{ url?: string; title?: string }>;
    };
    if (b.type === "text" && b.text) {
      text += b.text;
      for (const c of b.citations ?? []) {
        if (c.url) sources.push({ url: c.url, title: c.title ?? c.url });
      }
    }
    if (b.type === "web_search_tool_result") {
      const results = (block as { content?: unknown }).content;
      if (Array.isArray(results)) {
        for (const r of results) {
          const rr = r as { url?: string; title?: string };
          if (rr.url) sources.push({ url: rr.url, title: rr.title ?? rr.url });
        }
      }
    }
  }

  const parsed = parseJson(text);
  return {
    summary: parsed.summary,
    imagePrompt: parsed.imagePrompt,
    sources: dedupeSources(sources),
    provider: "anthropic",
    model,
  };
}

function parseJson(text: string): { summary: string; imagePrompt: string } {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { summary: trimmed, imagePrompt: trimmed };
  }
  try {
    const obj = JSON.parse(jsonMatch[0]) as { summary?: string; imagePrompt?: string };
    return {
      summary: obj.summary ?? "",
      imagePrompt: obj.imagePrompt ?? "",
    };
  } catch {
    return { summary: trimmed, imagePrompt: trimmed };
  }
}

function dedupeSources(sources: ResearchSource[]): ResearchSource[] {
  const seen = new Set<string>();
  const out: ResearchSource[] = [];
  for (const s of sources) {
    if (seen.has(s.url)) continue;
    seen.add(s.url);
    out.push(s);
  }
  return out.slice(0, 8);
}

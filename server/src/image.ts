import OpenAI from "openai";
import { request } from "undici";

export type Provider = "openai" | "replicate";

export interface GenerateArgs {
  prompt: string;
  provider?: Provider;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
}

export interface GenerateResult {
  dataUrl: string;
  provider: Provider;
  model: string;
}

export async function generateImage(args: GenerateArgs): Promise<GenerateResult> {
  const provider = args.provider ?? (process.env.OPENAI_API_KEY ? "openai" : "replicate");
  if (provider === "openai") return generateOpenAI(args);
  if (provider === "replicate") return generateReplicate(args);
  throw new Error(`unknown provider: ${provider}`);
}

async function generateOpenAI(args: GenerateArgs): Promise<GenerateResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
  const response = await client.images.generate({
    model,
    prompt: args.prompt,
    size: args.size ?? "1024x1024",
    n: 1,
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("openai returned no image data");
  return {
    dataUrl: `data:image/png;base64,${b64}`,
    provider: "openai",
    model,
  };
}

async function generateReplicate(args: GenerateArgs): Promise<GenerateResult> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not set");
  }
  const model = process.env.REPLICATE_MODEL ?? "black-forest-labs/flux-schnell";
  const create = await request(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: args.prompt,
        aspect_ratio: "1:1",
        output_format: "png",
        num_outputs: 1,
      },
    }),
  });
  const body = (await create.body.json()) as { output?: string[] | string; error?: string };
  if (body.error) throw new Error(body.error);
  const url = Array.isArray(body.output) ? body.output[0] : body.output;
  if (!url) throw new Error("replicate returned no output");
  const img = await request(url);
  const buf = Buffer.from(await img.body.arrayBuffer());
  return {
    dataUrl: `data:image/png;base64,${buf.toString("base64")}`,
    provider: "replicate",
    model,
  };
}

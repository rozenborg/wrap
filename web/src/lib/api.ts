import type { Provider } from "../store/wrapStore";

export interface GenerateImageResponse {
  dataUrl: string;
  provider: Provider;
  model: string;
}

export async function generateImage(
  prompt: string,
  provider: Provider
): Promise<GenerateImageResponse> {
  const res = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, provider }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `image gen failed (${res.status})`);
  }
  return (await res.json()) as GenerateImageResponse;
}

export interface SearchResult {
  title: string;
  url: string;
  thumbnail?: string;
  description?: string;
}

export async function searchImages(q: string): Promise<SearchResult[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `search failed (${res.status})`);
  }
  const body = (await res.json()) as { results: SearchResult[] };
  return body.results;
}

export async function fetchImageFromUrl(url: string): Promise<string> {
  const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `fetch failed (${res.status})`);
  }
  const body = (await res.json()) as { dataUrl: string };
  return body.dataUrl;
}

export async function getHealth(): Promise<{
  ok: boolean;
  providers: {
    openai: boolean;
    anthropic: boolean;
    replicate: boolean;
    brave: boolean;
  };
}> {
  const res = await fetch("/api/health");
  return res.json();
}

export type ResearchProvider = "openai" | "anthropic";

export interface ResearchSource {
  url: string;
  title: string;
}

export interface ResearchImageResponse {
  research: {
    summary: string;
    imagePrompt: string;
    sources: ResearchSource[];
    provider: ResearchProvider;
    model: string;
  };
  image: GenerateImageResponse;
}

export async function researchImage(
  brief: string,
  researchProvider: ResearchProvider,
  imageProvider: Provider
): Promise<ResearchImageResponse> {
  const res = await fetch("/api/research-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief, researchProvider, imageProvider }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `research failed (${res.status})`);
  }
  return (await res.json()) as ResearchImageResponse;
}

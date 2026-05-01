import { request } from "undici";

export interface SearchResult {
  title: string;
  url: string;
  thumbnail?: string;
  description?: string;
}

export async function webSearch(q: string): Promise<SearchResult[]> {
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    throw new Error("BRAVE_SEARCH_API_KEY not set");
  }
  const url = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(q)}&count=20`;
  const res = await request(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY,
    },
  });
  const data = (await res.body.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      thumbnail?: { src?: string };
      properties?: { url?: string };
    }>;
  };
  return (data.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.properties?.url ?? r.url ?? "",
    thumbnail: r.thumbnail?.src,
  }));
}

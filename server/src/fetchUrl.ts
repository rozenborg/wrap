import { request } from "undici";

export async function fetchUrlAsImage(url: string): Promise<string> {
  const res = await request(url, {
    headers: { "User-Agent": "Mozilla/5.0 tesla-wrap-studio" },
    maxRedirections: 5,
  });
  if (res.statusCode >= 400) {
    throw new Error(`upstream returned ${res.statusCode}`);
  }
  const contentType = String(res.headers["content-type"] ?? "image/png").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    throw new Error(`url is not an image (got ${contentType})`);
  }
  const buf = Buffer.from(await res.body.arrayBuffer());
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

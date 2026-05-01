import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateImage } from "./image.js";
import { webSearch } from "./search.js";
import { fetchUrlAsImage } from "./fetchUrl.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      replicate: Boolean(process.env.REPLICATE_API_TOKEN),
      brave: Boolean(process.env.BRAVE_SEARCH_API_KEY),
    },
  });
});

app.post("/api/image", async (req, res) => {
  try {
    const { prompt, provider, size } = req.body ?? {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }
    const result = await generateImage({ prompt, provider, size });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "image generation failed";
    res.status(500).json({ error: message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q ?? "");
    if (!q) return res.status(400).json({ error: "q is required" });
    const results = await webSearch(q);
    res.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "search failed";
    res.status(500).json({ error: message });
  }
});

app.get("/api/fetch-image", async (req, res) => {
  try {
    const url = String(req.query.url ?? "");
    if (!url) return res.status(400).json({ error: "url is required" });
    const dataUrl = await fetchUrlAsImage(url);
    res.json({ dataUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "fetch failed";
    res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`tesla-wrap-server listening on http://localhost:${port}`);
});

# Tesla Wrap Studio

Design and preview custom wraps for your **Tesla Model 3 (2024+ Premium)**, then
export a USB-ready PNG that drops straight into the Paint Shop in your car.

Built around the official [teslamotors/custom-wraps](https://github.com/teslamotors/custom-wraps)
template. The studio gives you a 1024×1024 design canvas overlaid on Tesla's
template, AI image generation, web-search references, and a live 3D preview.

```
┌──────────────────────────────────────────────────────────────┐
│  Tesla Wrap Studio                                  Model 3  │
├──────────┬───────────────────────────┬──────────┬────────────┤
│  AI      │                           │          │            │
│  Refs    │      Designer             │  3D      │ Inspector  │
│  Layers  │      (Konva canvas)       │  preview │            │
│          │                           │          │            │
├──────────┴───────────────────────────┴──────────┴────────────┤
│  Name [My_Wrap]  Size [1024]            [Export PNG for USB] │
└──────────────────────────────────────────────────────────────┘
```

## Features

- **Designer** — paint, layer, transform images, text, and shapes against the
  official Tesla UV template (toggle visibility / opacity).
- **AI image generation** — OpenAI **gpt-image-2** by default, switchable to
  Replicate Flux for cheaper iteration. Add results as a layer or as a reference.
- **Research mode** — describe a subject in plain English ("look up what a
  Japanese police car looks like and make it into a wrap"). The model
  (OpenAI gpt-4.1 or Claude) searches the web, writes a detailed image-gen
  prompt informed by what it found, then generates the wrap. Source links are
  added to your References panel automatically.
- **References** — drop image files, paste from URL, web-search via Brave, or
  let Research mode populate them with cited sources.
- **3D preview** — orbit around a stylized Model 3 with your design wrapped
  onto the body, updated live as you edit. Drop in a real `model3.glb` for a
  faithful preview.
- **USB export** — validates Tesla's filename rules, downscales until under
  1MB, saves as PNG.

## Quick start

```bash
# 1. Install everything
npm run install:all

# 2. Add your API keys
cp .env.example .env
$EDITOR .env

# 3. Run web (5173) + server (8787) together
npm run dev
```

Open <http://localhost:5173>.

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | for default provider | image model `gpt-image-2` (override with `OPENAI_IMAGE_MODEL`); research model `gpt-4.1` with `web_search` tool (override with `OPENAI_RESEARCH_MODEL`) |
| `ANTHROPIC_API_KEY` | optional | enables Claude as a research provider (uses Claude's `web_search` tool); model defaults to `claude-opus-4-7`, override with `ANTHROPIC_RESEARCH_MODEL` |
| `REPLICATE_API_TOKEN` | optional | cheaper image-gen alternative; defaults to `black-forest-labs/flux-schnell` |
| `BRAVE_SEARCH_API_KEY` | optional | only needed for the manual image-search panel — Research mode uses OpenAI/Claude `web_search` and does **not** require this |
| `PORT` | optional | server port, default `8787` |

The provider switch in the AI panel hides options whose keys are missing.

## Sending a wrap to your car

1. Click **Export PNG for USB** in the studio.
2. Format a USB drive as **exFAT, FAT32, MS-DOS FAT, ext3, or ext4** (NTFS is unsupported).
3. Create a folder named **`Wraps`** at the root of the drive.
4. Copy the exported PNG into that folder.
5. In the car: **Toybox → Paint Shop → Wraps tab**, select your design.

Tesla's rules (enforced by the export):
- Up to **10 wraps** per drive
- **PNG only**, **≤ 1 MB**, **512×512 to 1024×1024**
- Filenames: alphanumeric + space + `_` + `-`, **max 30 chars**

## 3D preview accuracy

The default 3D preview uses a stylized procedural body — it shows how your
design reads on a curved car-like surface, but it is **not** geometrically
identical to a Model 3, and the UVs do **not** match Tesla's template. Use it
to judge composition, not exact placement.

For a faithful preview, drop a glTF Model 3 mesh at:

```
web/public/models/model3.glb
```

Meshes whose names contain `body`, `paint`, `wrap`, `exterior`, or `panel`
will receive the wrap texture; everything else (glass, wheels, etc.) is left
alone. To get pixel-accurate placement you'd need a mesh whose UVs match
Tesla's `template.png` — that's the same UV layout the car uses internally.

## Layout

```
wrap/
├── package.json              # root scripts (dev, build, install:all)
├── .env.example              # API keys template
├── assets/
│   ├── tesla/model3-2024-base/   # template.png + vehicle_image.png from Tesla
│   └── models/                   # drop a model3.glb here for real 3D preview
├── server/                   # Express API (image gen, search, URL fetch)
│   └── src/
│       ├── index.ts          # routes
│       ├── image.ts          # OpenAI / Replicate
│       ├── search.ts         # Brave Search
│       └── fetchUrl.ts       # URL → data: URL
└── web/                      # Vite + React + R3F + Konva
    ├── src/
    │   ├── App.tsx
    │   ├── store/wrapStore.ts
    │   ├── components/
    │   │   ├── Designer.tsx
    │   │   ├── Toolbar.tsx
    │   │   ├── LayersPanel.tsx
    │   │   ├── InspectorPanel.tsx
    │   │   ├── AIPanel.tsx
    │   │   ├── ReferencesPanel.tsx
    │   │   ├── Preview3D.tsx
    │   │   └── ExportBar.tsx
    │   └── lib/              # api client, file helpers, export utils
    └── public/tesla/         # template.png served as /tesla/template.png
```

## Roadmap

- [ ] Drop-in Model 3 GLB with template-matched UVs
- [ ] Export the 3D preview as a turntable video
- [ ] Inpainting on a selected region (gpt-image-2 edit endpoint)
- [ ] Pattern presets (camo, tartan, halftone, gradient)
- [ ] Save / load project files (.wrap.json)
- [ ] Support other Tesla models (Model Y, S, X, Cybertruck)

## Acknowledgements

- Template & vehicle reference: [teslamotors/custom-wraps](https://github.com/teslamotors/custom-wraps)
- Tesla and Model 3 are trademarks of Tesla, Inc. This is an unaffiliated tool.

/**
 * Server-side card renderer using Satori (JSX → SVG).
 * Fonts are loaded once at module level to avoid per-request overhead.
 * Returns SVG string — browsers render SVG natively in <img> tags.
 */

import satori, { type Font } from "satori";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import sharp from "sharp";
import CardTemplate, { type CardRenderData, CardTemplateLandscape, L_WIDTH, L_HEIGHT } from "./CardTemplate";
import connectDB from "@/lib/mongodb";
import CardCropModel from "@/models/CardCrop";

const WIDTH = 512;
const HEIGHT = 880;

// ── Load fonts lazily (once per process) ──────────────────────────────────

let fontsPromise: Promise<Font[]> | null = null;

/** Clear cached fonts so they reload on next render. */
export function clearFontCache() {
  fontsPromise = null;
}

function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = (async (): Promise<Font[]> => {
      const fontsDir = join(process.cwd(), "public", "fonts");
      const [cinzelBold, rajdhaniReg, rajdhaniBold] = await Promise.all([
        readFile(join(fontsDir, "Cinzel-Bold.ttf")),
        readFile(join(fontsDir, "Rajdhani-Regular.ttf")),
        readFile(join(fontsDir, "Rajdhani-Bold.ttf")),
      ]);
      return [
        { name: "Cinzel", data: new Uint8Array(cinzelBold).buffer as ArrayBuffer, weight: 700 as const, style: "normal" as const },
        { name: "Rajdhani", data: new Uint8Array(rajdhaniReg).buffer as ArrayBuffer, weight: 400 as const, style: "normal" as const },
        { name: "Rajdhani", data: new Uint8Array(rajdhaniBold).buffer as ArrayBuffer, weight: 700 as const, style: "normal" as const },
      ];
    })();
  }
  return fontsPromise;
}

// ── Convert card image to a JPEG data URI (Satori only supports JPEG/PNG) ──

async function resolveImageDataUri(
  imageUrl: string,
  baseUrl: string,
  crop?: { x: number; y: number; width: number; height: number } | null,
): Promise<string> {
  if (!imageUrl) return "";

  try {
    let imageBuffer: Buffer;

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const res = await fetch(imageUrl, { cache: "no-store" });
      if (!res.ok) return "";
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Local path — read directly from disk (avoids an HTTP round-trip)
      const localPath = join(process.cwd(), "public", imageUrl);
      imageBuffer = await readFile(localPath);
    }

    let pipeline = sharp(imageBuffer);

    // Apply crop if set in admin
    if (crop && crop.width > 0 && crop.height > 0) {
      pipeline = pipeline.extract({
        left: Math.max(0, Math.round(crop.x)),
        top: Math.max(0, Math.round(crop.y)),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      });
    }

    // Keep as high quality JPEG for best resolution inside Satori (100 quality)
    const jpegBuffer = await pipeline.jpeg({ quality: 100, chromaSubsampling: '4:4:4' }).toBuffer();
    return `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
  } catch {
    return "";
  }
}

// ── Resolve local icon PNGs to data URIs (cached per process) ─────────────

let iconMapCache: Record<string, string> | null = null;

async function resolveIconMap(): Promise<Record<string, string>> {
  if (iconMapCache) return iconMapCache;

  const publicDir = join(process.cwd(), "public");
  const paths = [
    "/icons/types/character.png",
    "/icons/types/arsenal.png",
    "/icons/types/destination.png",
    "/icons/types/trick.png",
    "/icons/character-types/human.png",
    "/icons/character-types/goblin.png",
    "/icons/character-types/beast.png",
    "/icons/character-types/underworld.png",
    "/Master-of-Masters-Logo.png",
  ];

  const map: Record<string, string> = {};
  await Promise.all(
    paths.map(async (p) => {
      try {
        const buf = await readFile(join(publicDir, p));
        map[p] = `data:image/png;base64,${buf.toString("base64")}`;
      } catch { /* icon not found — skip */ }
    }),
  );

  iconMapCache = map;
  return map;
}

/** Clear cached icon data URIs (e.g. after icon assets change). */
export function clearIconCache() {
  iconMapCache = null;
}

// ── Render function ───────────────────────────────────────────────────────

export async function renderCardSvg(
  card: CardRenderData,
  baseUrl: string = "",
): Promise<string> {
  // Fetch crop data from DB
  let cropData: { x: number; y: number; width: number; height: number } | null = null;
  try {
    await connectDB();
    const cropKey = card.cardId || card.name;
    const cropDoc = await CardCropModel.findOne({ cardId: cropKey }).lean()
      ?? await CardCropModel.findOne({ cardId: cropKey.toLowerCase() }).lean();
    if (cropDoc) cropData = cropDoc.crop;
  } catch { /* no crop */ }

  const [fonts, imageDataUri, iconMap] = await Promise.all([
    loadFonts(),
    resolveImageDataUri(card.imageUrl, baseUrl, cropData),
    resolveIconMap(),
  ]);

  const cardWithDataUri: CardRenderData = imageDataUri
    ? { ...card, imageUrl: imageDataUri }
    : { ...card, imageUrl: "" };

  const isLandscape = card.type === "destination";

  return satori(
    createElement(
      isLandscape ? CardTemplateLandscape : CardTemplate,
      { card: cardWithDataUri, baseUrl, iconMap },
    ),
    {
      width: isLandscape ? L_WIDTH : WIDTH,
      height: isLandscape ? L_HEIGHT : HEIGHT,
      fonts,
    },
  );
}

/**
 * Render card as a high-resolution PNG buffer (2× for retina).
 * Satori produces SVG at native size → sharp rasterises it at 2× density.
 */
export async function renderCardPng(
  card: CardRenderData,
  baseUrl: string = "",
  scale: number = 2,
): Promise<Buffer> {
  const svg = await renderCardSvg(card, baseUrl);
  const isLandscape = card.type === "destination";
  const w = (isLandscape ? L_WIDTH : WIDTH) * scale;
  const h = (isLandscape ? L_HEIGHT : HEIGHT) * scale;

  return sharp(Buffer.from(svg))
    .resize(w, h)
    .png()
    .toBuffer();
}

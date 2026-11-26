// Generates the PWA / home-screen icons into public/icons/ using Next's built-in ImageResponse.
// Run once (or after changing the design): node scripts/make-icons.mts

import { mkdirSync, writeFileSync } from "node:fs";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

// Shirt outline from lucide (ISC licence), drawn on a 24x24 grid.
const SHIRT =
  "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z";

/** glyph = share of the canvas the shirt fills (smaller for maskable so Android's crop keeps it whole). */
function icon(size: number, glyph: number) {
  const g = Math.round(size * glyph);
  return new ImageResponse(
    h(
      "div",
      {
        style: {
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#141414",
        },
      },
      h(
        "svg",
        { width: g, height: g, viewBox: "0 0 24 24", fill: "none", stroke: "#ffffff", strokeWidth: 1.6, strokeLinejoin: "round", strokeLinecap: "round" },
        h("path", { d: SHIRT }),
      ),
    ),
    { width: size, height: size },
  );
}

const out = new URL("../public/icons/", import.meta.url);
mkdirSync(out, { recursive: true });

const files: [string, number, number][] = [
  ["icon-192.png", 192, 0.58],
  ["icon-512.png", 512, 0.58],
  ["icon-maskable-512.png", 512, 0.46],
  ["apple-touch-icon.png", 180, 0.56],
];
for (const [name, size, glyph] of files) {
  const res = icon(size, glyph);
  writeFileSync(new URL(name, out), Buffer.from(await res.arrayBuffer()));
  console.log(`✓ public/icons/${name}`);
}

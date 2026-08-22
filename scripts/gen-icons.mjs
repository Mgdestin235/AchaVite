import { ImageResponse } from "next/og.js";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const NAVY = "#0B1F3A";
const ORANGE = "#FF7A1A";
const WHITE = "#FFFFFF";

function logoElement(size, { padding = 0.16, radius = 0.22, bg = NAVY } = {}) {
  const pad = size * padding;
  const inner = size - pad * 2;
  return {
    type: "div",
    props: {
      style: {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        borderRadius: size * radius,
      },
      children: {
        type: "div",
        props: {
          style: {
            width: inner,
            height: inner,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  width: inner * 0.62,
                  height: inner * 0.62,
                  borderRadius: "9999px",
                  border: `${Math.max(4, inner * 0.055)}px solid ${ORANGE}`,
                  display: "flex",
                },
              },
            },
            {
              type: "div",
              props: {
                style: {
                  color: WHITE,
                  fontSize: inner * 0.46,
                  fontWeight: 800,
                  fontFamily: "sans-serif",
                  display: "flex",
                },
                children: "A",
              },
            },
          ],
        },
      },
    },
  };
}

async function renderPng(size, opts) {
  const res = new ImageResponse(logoElement(size, opts), {
    width: size,
    height: size,
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "icons");
  await mkdir(outDir, { recursive: true });

  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-maskable-192.png", size: 192, opts: { padding: 0.28, radius: 0 } },
    { name: "icon-maskable-512.png", size: 512, opts: { padding: 0.28, radius: 0 } },
    { name: "apple-touch-icon.png", size: 180, opts: { radius: 0.22 } },
  ];

  for (const { name, size, opts } of sizes) {
    const buf = await renderPng(size, opts);
    await writeFile(path.join(outDir, name), buf);
    console.log("wrote", name, buf.length, "bytes");
  }

  const favBuf = await renderPng(48);
  await writeFile(path.join(process.cwd(), "public", "favicon.png"), favBuf);
  console.log("wrote favicon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

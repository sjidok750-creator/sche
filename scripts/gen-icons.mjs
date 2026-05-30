import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

const plane = (color) => `
  <path d="M256 96c-14 0-22 18-22 52v44L110 264v34l124-38v74l-34 26v30l56-16 56 16v-30l-34-26v-74l124 38v-34L278 192v-44c0-34-8-52-22-52z" fill="${color}"/>`;

// 일반 아이콘: 둥근 사각 배경
const standard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0a1f44"/>${plane("#5b8def")}</svg>`;

// 마스커블: 안전영역 고려해 가득 찬 배경 + 중앙 80%
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a1f44"/>
  <g transform="translate(51 51) scale(0.8)">${plane("#5b8def")}</g></svg>`;

async function png(svg, size, out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}

await png(standard, 192, "public/icons/icon-192.png");
await png(standard, 512, "public/icons/icon-512.png");
await png(maskable, 192, "public/icons/icon-192-maskable.png");
await png(maskable, 512, "public/icons/icon-512-maskable.png");
await png(standard, 180, "public/apple-touch-icon.png");
console.log("done");

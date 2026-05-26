import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

async function main() {
  mkdirSync("./public/icons", { recursive: true });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="96" fill="#009C3B"/>
    <circle cx="256" cy="256" r="160" fill="#FFDF00"/>
    <text x="256" y="290" font-family="system-ui,sans-serif" font-size="160" font-weight="900" text-anchor="middle" fill="#002776">26</text>
  </svg>`;

  writeFileSync("./public/icons/icon.svg", svg);

  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile("./public/icons/icon-192.png");
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile("./public/icons/icon-512.png");
  await sharp(Buffer.from(svg)).resize(180, 180).png().toFile("./public/icons/apple-touch-icon.png");
  await sharp(Buffer.from(svg)).resize(32, 32).png().toFile("./public/favicon.png");

  console.log("✓ Icons generated");
}

main().catch((e) => { console.error(e); process.exit(1); });

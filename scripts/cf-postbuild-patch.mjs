import { readFileSync, writeFileSync, existsSync } from "node:fs";

const HANDLER = ".open-next/server-functions/default/handler.mjs";

if (!existsSync(HANDLER)) {
  console.error(`[postbuild-patch] ${HANDLER} not found — run \`opennextjs-cloudflare build\` first`);
  process.exit(1);
}

let src = readFileSync(HANDLER, "utf8");
const before = src.length;

// OpenNext stubs manifest reads with `path2.endsWith("/server/foo-manifest.json")`.
// On Windows, path2 contains backslashes (e.g. ".next\server\middleware-manifest.json"),
// so the comparison fails → the runtime falls through to a dynamic require that
// the Workers sandbox cannot resolve, producing 500s on every request.
// Normalize backslashes before comparing. Idempotent: skips if already patched.
const NEEDLE = "path2.endsWith(";
const PATCHED = "path2.replace(/\\\\/g,'/').endsWith(";

if (src.includes(PATCHED)) {
  console.log("[postbuild-patch] handler already patched — skipping");
  process.exit(0);
}

const occurrences = src.split(NEEDLE).length - 1;
src = src.split(NEEDLE).join(PATCHED);
writeFileSync(HANDLER, src);

console.log(`[postbuild-patch] patched ${occurrences} manifest path comparison(s); size ${before} → ${src.length}`);

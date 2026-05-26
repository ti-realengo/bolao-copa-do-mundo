import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// IMPORTANT: `defineCloudflareConfig` only forwards a fixed list of fields
// (incrementalCache, tagCache, queue, cachePurge, enableCacheInterception,
// routePreloadingBehavior). Any other field — including `buildCommand` — is
// silently dropped. Without buildCommand, OpenNext defaults to running
// `<packager> build`, which on this repo is itself (`pnpm build`) →
// infinite recursion → CF Workers Builds OOM-kills the process.
//
// Workaround: spread the helper output and add `buildCommand` afterwards so
// OpenNext sees it on the final config. We invoke `next` directly via the
// local node_modules binary to avoid pnpm script resolution entirely.
const config = defineCloudflareConfig({});

export default {
  ...config,
  buildCommand: "node node_modules/next/dist/bin/next build",
};

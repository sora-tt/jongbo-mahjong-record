import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const iconDirectory = resolve(process.cwd(), "public/icons");

const getPngDimensions = (path: string) => {
  const image = readFileSync(path);
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");

  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
  };
};

test("manifest declares the standalone Jongbo launch contract", async () => {
  const manifestModule = await import("./manifest").catch(() => undefined);
  assert.ok(manifestModule, "the App Router manifest route must be available");

  const manifest = manifestModule.default();
  assert.equal(manifest.name, "jongbo | 麻雀記録");
  assert.equal(manifest.short_name, "jongbo");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.background_color, "#ffffff");
  assert.equal(manifest.theme_color, "#e8736b");
  assert.equal(manifest.orientation, undefined);
  assert.deepEqual(manifest.icons, [
    {
      src: "/icons/jongbo-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/jongbo-512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/icons/jongbo-512-maskable.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ]);
});

test("manifest and Apple touch icons are valid PNGs at their declared sizes", () => {
  const expectedIcons = [
    ["jongbo-192.png", 192],
    ["jongbo-512.png", 512],
    ["jongbo-512-maskable.png", 512],
    ["jongbo-apple-touch.png", 180],
  ] as const;

  for (const [fileName, size] of expectedIcons) {
    assert.deepEqual(getPngDimensions(resolve(iconDirectory, fileName)), {
      width: size,
      height: size,
    });
  }
});

test("root layout publishes Apple app metadata and a safe standalone viewport", () => {
  const layoutSource = readFileSync(
    resolve(process.cwd(), "src/app/layout.tsx"),
    "utf8"
  );

  assert.match(layoutSource, /appleWebApp:\s*\{[\s\S]*?capable:\s*true/);
  assert.match(layoutSource, /appleWebApp:\s*\{[\s\S]*?title:\s*"jongbo"/);
  assert.match(
    layoutSource,
    /apple:\s*\{[\s\S]*?url:\s*"\/icons\/jongbo-apple-touch\.png"/
  );
  assert.match(layoutSource, /title:\s*"jongbo \| 麻雀記録"/);
  assert.match(
    layoutSource,
    /description:\s*"麻雀のリーグ・対局・成績を記録するアプリ"/
  );
  assert.match(layoutSource, /themeColor:\s*"#e8736b"/);
  assert.match(layoutSource, /viewportFit:\s*"cover"/);
});

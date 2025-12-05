import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { buildSync } from "esbuild";

const PLUGIN_DIR = path.resolve("./visualizer/plugins");
const TEMP_DIR = path.resolve("./.plugin-temp");

// 确保临时目录存在
fs.mkdirSync(TEMP_DIR, { recursive: true });

async function run() {
  const files = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith("Plugin.tsx"));

  const result: Record<string, any> = {};

  for (const file of files) {
    const srcPath = path.join(PLUGIN_DIR, file);
    const outPath = path.join(TEMP_DIR, file.replace(".tsx", ".mjs"));

    // 用 esbuild 转为 JS（ESM）
    buildSync({
      entryPoints: [srcPath],
      outfile: outPath,
      platform: "node",
      format: "esm",
      sourcemap: false,
      bundle: true,
      jsx: "transform",
    });

    const fileUrl = pathToFileURL(outPath).href;

    console.log(`Importing: ${fileUrl}`);

    const mod = await import(fileUrl);

    const plugin = Object.values(mod).find(
      v => v && typeof v === "object" && "id" in v
    );

    if (!plugin) {
      console.warn(`⚠ No plugin object found in: ${file}`);
      continue;
    }

    result[plugin.id] = {
      pluginId: plugin.id,
      params: plugin.defaultParams ?? {},
    };
  }

  console.log(JSON.stringify(result, null, 2));
}

run().catch(err => {
  console.error("❌ Script failed:", err);
  console.error(err?.stack || err);
  process.exit(1);
});

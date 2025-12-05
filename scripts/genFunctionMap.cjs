// scripts/genFunctionMap.cjs

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const PLUGIN_DIR = path.resolve("./visualizer/plugins");

async function run() {
  const files = fs.readdirSync(PLUGIN_DIR)
    .filter(f => f.endsWith("Plugin.tsx"));

  const result = {};

  for (const file of files) {
    const fullPath = path.join(PLUGIN_DIR, file);
    const fileUrl = pathToFileURL(fullPath).href;

    console.log(`Importing: ${fileUrl}`);
    const mod = await import(fileUrl); // 这里仍然用 ESM 动态 import

    const plugin = Object.values(mod).find(
      v => v && typeof v === "object" && "id" in v
    );

    if (!plugin) {
      console.warn(`⚠ No plugin object found in: ${file}`);
      continue;
    }

    result[plugin.id] = {
      pluginId: plugin.id,
      params: plugin.defaultParams ?? {}
    };
  }

  console.log(JSON.stringify(result, null, 2));
}

run().catch(err => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});

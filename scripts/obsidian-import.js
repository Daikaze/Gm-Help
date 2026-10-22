import { listZipEntries, readZipEntry } from "./zip-reader.js";
import { readRawObsidianVault, imageAsWebp } from "./raw-obsidian.js";

/** Accepts either the optimized GM Help export ZIP or an original Obsidian vault ZIP. */
export async function readAverisZip(file) {
  const directory = await listZipEntries(file);
  const manifest = directory.get("records.json");
  if (!manifest) return await readRawObsidianVault(file, directory);
  if (manifest.unpacked > 6_000_000) throw Error("The prepared import manifest is too large.");
  const payload = JSON.parse(new TextDecoder("utf-8").decode(await readZipEntry(file, manifest, 6_000_000)));
  if (payload?.format !== "gm-help-obsidian" || payload.version !== 1 ||
    !Array.isArray(payload.entries) || !Array.isArray(payload.assets))
    throw Error("Invalid prepared GM Help Obsidian import file.");
  if (payload.entries.length > 1500 || payload.assets.length > 400)
    throw Error("Prepared bundle entry limits exceeded.");
  for (const asset of payload.assets) {
    if (!asset || !/^[a-z0-9_-]+\.webp$/.test(asset.file || "") ||
      !directory.has("assets/" + asset.file))
      throw Error("Missing or invalid image in prepared archive.");
  }
  // ZIP bytes remain on disk. Image entries are unpacked one at a time only during upload.
  return { mode: "prepared", zipFile: file, zipDirectory: directory, payload };
}

async function ensureDirectory(picker, path) {
  try {
    await picker.createDirectory("data", path);
  } catch (error) {
    try { await picker.browse("data", path); }
    catch { throw Error("Could not create GM Help image folder: " + path + ". " + error.message); }
  }
}

export async function uploadAverisImages(bundle, notify) {
  const picker = foundry.applications.apps.FilePicker;
  const folder = "gm-help/obsidian-assets";
  await ensureDirectory(picker, "gm-help");
  await ensureDirectory(picker, folder);
  const already = new Set();
  try {
    const listing = await picker.browse("data", folder);
    for (const path of listing.files || []) {
      try { already.add(decodeURIComponent(String(path).split("/").at(-1))); }
      catch { already.add(String(path).split("/").at(-1)); }
    }
  } catch (error) {
    console.warn("GM Help | Unable to list existing assets. Re-uploading.", error);
  }
  const assets = bundle.payload.assets;
  let uploaded = 0, skipped = 0;
  const failed = [];
  for (let index = 0; index < assets.length; index++) {
    const asset = assets[index];
    if (already.has(asset.file)) { skipped++; continue; }
    try {
      const path = bundle.mode === "raw-vault" ? asset.zipPath : "assets/" + asset.file;
      const entry = bundle.zipDirectory.get(path);
      if (!entry) throw Error("Image missing from ZIP: " + path);
      const bytes = await readZipEntry(bundle.zipFile, entry, 35_000_000);
      const webp = bundle.mode === "raw-vault"
        ? await imageAsWebp(bytes, asset.original)
        : new Blob([bytes], { type: "image/webp" });
      const upload = new File([webp], asset.file, { type: "image/webp" });
      const result = await picker.upload("data", folder, upload, {}, { notify: false });
      if (!result || result.error) throw Error(result?.error || "Foundry did not confirm upload.");
      uploaded++;
      already.add(asset.file);
    } catch (error) {
      failed.push(asset.file);
      console.error("GM Help | Failed to upload image", asset.original || asset.file, error);
    }
    if (index % 10 === 9 || index + 1 === assets.length) {
      notify?.("GM Help: processed " + (index + 1) + "/" + assets.length +
        " images (" + uploaded + " uploaded, " + skipped + " already present, " +
        failed.length + " failed).");
      // Keep Foundry's UI responsive during a long import.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  return { uploaded, skipped, failed };
}

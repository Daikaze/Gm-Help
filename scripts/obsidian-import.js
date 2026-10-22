/**
 * Read the export bundle generated from an Obsidian vault.
 * Only uncompressed ZIP (STORE method 0) is supported so importing works
 * without third-party dependencies or touching the user's original archive.
 */
export async function readAverisZip(file) {
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".zip"))
    throw new Error("Select the prepared Averis_GM_Help_Import.zip file.");
  if (file.size > 130_000_000) throw new Error("Bundle exceeds the 130 MB safety limit.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = new Map();
  let index = 0, count = 0;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  while (index + 4 <= bytes.length) {
    const sig = view.getUint32(index, true);
    if (sig === 0x02014b50 || sig === 0x06054b50) break; // Central directory/end.
    if (sig !== 0x04034b50) throw new Error("Invalid ZIP local header.");
    if (++count > 400) throw new Error("ZIP contains too many files.");
    if (index + 30 > bytes.length) throw new Error("Truncated ZIP header.");
    const flags = view.getUint16(index + 6, true);
    const method = view.getUint16(index + 8, true);
    const compressed = view.getUint32(index + 18, true);
    const uncompressed = view.getUint32(index + 22, true);
    const nameLen = view.getUint16(index + 26, true);
    const extraLen = view.getUint16(index + 28, true);
    if (method !== 0 || compressed !== uncompressed || (flags & 9))
      throw new Error("ZIP must use STORE compression without encryption or data descriptors.");
    const nameStart = index + 30, payloadStart = nameStart + nameLen + extraLen;
    if (payloadStart + compressed > bytes.length) throw new Error("Invalid ZIP entry length.");
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLen));
    if (name.includes("..") || name.startsWith("/") || name.includes("\\"))
      throw new Error("Unsafe ZIP path.");
    if (files.has(name)) throw new Error("Duplicate ZIP filename.");
    if (name === "records.json" || /^assets\/[a-z0-9_-]+\.webp$/.test(name))
      files.set(name, bytes.subarray(payloadStart, payloadStart + compressed));
    index = payloadStart + compressed;
  }
  if (!files.has("records.json")) throw new Error("records.json missing from archive.");
  const jsonBytes = files.get("records.json");
  if (jsonBytes.byteLength > 5_000_000) throw new Error("Archive metadata exceeds 5MB.");
  const payload = JSON.parse(decoder.decode(jsonBytes));
  if (payload?.format !== "gm-help-obsidian" || payload.version !== 1 || !Array.isArray(payload.entries))
    throw new Error("Invalid GM Help Obsidian import format.");
  if (payload.entries.length > 500 || !Array.isArray(payload.assets) || payload.assets.length > 200)
    throw new Error("Bundle record limits exceeded.");
  for (const asset of payload.assets) {
    if (!asset || typeof asset.file !== "string" || !/^[a-z0-9_-]+\.webp$/.test(asset.file))
      throw new Error("Invalid image attachment.");
    if (!files.has("assets/" + asset.file)) throw new Error("Missing image " + asset.file);
  }
  return { payload, files };
}

export async function uploadAverisImages(bundle, notify) {
  const picker = foundry.applications.apps.FilePicker;
  const directory = "gm-help/obsidian-assets";
  for (const path of ["gm-help", directory]) {
    try {
      await picker.createDirectory("data", path);
    } catch (error) {
      // Verify that the target exists before ignoring 'already exists' errors.
      try { await picker.browse("data", path); }
      catch { throw new Error("Could not create the Foundry image folder: " + path + ". " + error.message); }
    }
  }
  let uploaded = 0, failed = [];
  for (const asset of bundle.payload.assets) {
    const bytes = bundle.files.get("assets/" + asset.file);
    const file = new File([bytes], asset.file, { type: "image/webp" });
    try {
      const result = await picker.upload("data", directory, file, {}, { notify: false });
      if (result?.error) throw new Error(String(result.error));
      uploaded++;
    } catch (error) {
      console.error("GM Help | Asset upload failed:", asset.file, error);
      failed.push(asset.file);
    }
    if (uploaded % 10 === 0 && uploaded !== 0) notify?.("GM Help: Uploaded " + uploaded + " / " + bundle.payload.assets.length + " images.");
  }
  return { uploaded, failed };
}

/**
 * GM Help archive: a GM-restricted WORLD COMPENDIUM, not a shared world setting.
 * Its documents do not live in game.journal / JournalDirectory, so the Monk's
 * journal directory UI and its render hooks are not modified.
 */
const MODULE_ID = "gm-help";
const PACK_ID = "world.gm-help-private";
let archivePack = null;
let cached = [];
let loading = null;

export async function loadArchive() {
  if (!game.user?.isGM) throw new Error("GM Help is restricted to the Game Master.");
  if (archivePack && cached) return;
  if (loading) return loading;
  loading = (async () => {
    let pack = game.packs.get(PACK_ID);
    if (!pack) {
      pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
        name: "gm-help-private",
        label: "GM Help | Private Archive",
        type: "JournalEntry",
        package: "world",
        ownership: {
          PLAYER: "NONE", TRUSTED: "NONE", ASSISTANT: "NONE", GAMEMASTER: "OWNER"
        }
      });
    }
    if (pack.locked) throw new Error("Unlock the GM Help | Private Archive world compendium before editing.");
    const ownership = pack.ownership || {};
    if (ownership.PLAYER !== "NONE" || ownership.TRUSTED !== "NONE" || ownership.ASSISTANT !== "NONE" || ownership.GAMEMASTER !== "OWNER") {
      await pack.configure({
        ownership: {
          PLAYER: "NONE", TRUSTED: "NONE", ASSISTANT: "NONE", GAMEMASTER: "OWNER"
        }
      });
    }
    archivePack = pack;
    cached = [...await pack.getDocuments()];
  })();
  try { await loading; }
  finally { loading = null; }
}

const toWrapper = (doc) => ({
  id: doc.id,
  name: doc.name,
  getFlag(module, key) { return doc.getFlag(module, key); },
  async update(change) {
    const updated = await doc.update(change);
    const current = updated || doc;
    cached = cached.map((existing) => existing.id === doc.id ? current : existing);
    return toWrapper(current);
  },
  async delete() {
    await doc.delete();
    cached = cached.filter((existing) => existing.id !== doc.id);
  }
});

export function documents() {
  return cached
    .filter((doc) => doc.getFlag(MODULE_ID, "record")?.type)
    .map(toWrapper);
}

export function getRecord(document) {
  return document?.getFlag(MODULE_ID, "record") || {};
}

export async function createRecord(name, record) {
  await loadArchive();
  const doc = await JournalEntry.create({
    name,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
    flags: { [MODULE_ID]: { record } }
  }, { pack: archivePack.collection });
  if (!doc) throw new Error("Could not create the archive record.");
  cached.push(doc);
  return toWrapper(doc);
}

/** Read-only search for 0.1.0 entries. Only called by the GM Help UI. */
export function legacyDocuments() {
  return game.journal.filter((doc) => doc.getFlag(MODULE_ID, "record")?.type);
}


/** Compatibility migration for the brief 0.2.0 release (world-setting storage).
 * This is NOT the normal archive storage. Empty it once verified private copies exist.
 */
export function registerLegacySetting() {
  game.settings.register(MODULE_ID, "records", {
    name: "GM Help v0.2 legacy records (migration only)",
    scope: "world", config: false, type: String, default: "[]"
  });
}
export function legacyWorldRecords() {
  if (!game.user?.isGM) return [];
  try {
    const entries = JSON.parse(game.settings.get(MODULE_ID, "records") || "[]");
    if (!Array.isArray(entries)) return [];
    return entries.filter((r) => r && typeof r.name === "string" && r.record?.type)
      .map((r) => ({ name: r.name, ...r.record, key: r.record.key || ("gm-help-v02:" + r.id) }));
  } catch (error) {
    console.error("GM Help | Invalid legacy world setting. Do not overwrite it.", error);
    return [];
  }
}
export async function clearLegacySetting() {
  if (!game.user?.isGM) throw new Error("GM only");
  await game.settings.set(MODULE_ID, "records", "[]");
}

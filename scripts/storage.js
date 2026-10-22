/**
 * GM Help v0.2 storage — deliberately independent from Foundry JournalEntry documents.
 * No Hooks on JournalDirectory, no global Application patches, and no external module APIs.
 * Data persists in the world setting "gm-help.records" as portable JSON.
 */
const MODULE_ID = "gm-help";
const SETTING = "records";

export function registerStorage() {
  game.settings.register(MODULE_ID, SETTING, {
    name: "GM Help Records (internal)",
    hint: "Private GM campaign encyclopedia storage; managed through GM Help.",
    scope: "world",
    config: false,
    type: String,
    default: "[]"
  });
}

function readRecords() {
  const value = game.settings.get(MODULE_ID, SETTING);
  try {
    const records = JSON.parse(value || "[]");
    if (!Array.isArray(records)) throw new Error("Data is not an array");
    return records;
  } catch (error) {
    console.error("GM Help | Invalid saved records. Storage left untouched.", error);
    throw new Error("Saved GM Help data is invalid. Do not overwrite it; restore a backup.");
  }
}
async function writeRecords(records) {
  if (!game.user?.isGM) throw new Error("Only the GM may edit these records.");
  await game.settings.set(MODULE_ID, SETTING, JSON.stringify(records));
}

function asDocument(data) {
  return {
    id: data.id,
    name: data.name,
    getFlag(module, key) {
      return module === MODULE_ID && key === "record" ? data.record : undefined;
    },
    async update(change) {
      const records = readRecords();
      const index = records.findIndex((r) => r.id === data.id);
      if (index < 0) throw new Error("This entry no longer exists.");
      const newName = typeof change.name === "string" ? change.name : records[index].name;
      const newRecord = change["flags." + MODULE_ID + ".record"] ?? records[index].record;
      records[index] = { ...records[index], name: newName, record: newRecord };
      await writeRecords(records);
      return asDocument(records[index]);
    },
    async delete() {
      const records = readRecords();
      const remaining = records.filter((r) => r.id !== data.id);
      if (remaining.length === records.length) throw new Error("This entry no longer exists.");
      await writeRecords(remaining);
    }
  };
}

export function documents() {
  return readRecords()
    .filter((r) => r && typeof r.id === "string" && typeof r.name === "string" && r.record?.type)
    .map(asDocument);
}

export function getRecord(document) {
  return document?.getFlag(MODULE_ID, "record") || {};
}

export async function createRecord(name, record) {
  const entries = readRecords();
  const data = { id: foundry.utils.randomID(16), name, record };
  entries.push(data);
  await writeRecords(entries);
  return asDocument(data);
}

/** Read-only legacy discovery. Does not register Journal hooks or create Journal documents. */
export function legacyDocuments() {
  return game.journal.filter((doc) => doc.getFlag(MODULE_ID, "record")?.type);
}

import { AVERIS_SEED } from "./averis-data.js";
import { renderObsidianMarkdown } from "./obsidian-render.js";
import { readAverisZip, uploadAverisImages } from "./obsidian-import.js";
import { loadArchive, registerLegacySetting, legacyWorldRecords, clearLegacySetting, documents, getRecord, createRecord, legacyDocuments } from "./storage.js";

const MODULE_ID = "gm-help";
const TYPES = {
  npc: ["NPCs", "fa-user"],
  city: ["Cities", "fa-city"],
  location: ["Locations", "fa-map-location-dot"],
  faction: ["Factions", "fa-users"],
  quest: ["Quests", "fa-scroll"],
  event: ["Events", "fa-calendar-days"],
  lore: ["World Lore", "fa-book"],
  item: ["Important Items", "fa-gem"],
  session: ["Sessions", "fa-calendar-check"],
  character: ["Characters", "fa-users-viewfinder"],
  mechanic: ["Mechanics", "fa-gears"],
  creature: ["Creatures", "fa-dragon"],
  deity: ["Deities", "fa-sun"],
  other: ["Other", "fa-folder"]
};
const COMMON_FIELDS = [
  ["subtitle", "Title / role"],
  ["location", "Location"],
  ["faction", "Faction / affiliation"],
  ["status", "Status"]
];
const TYPE_FIELDS = {
  npc: [["species", "Race / species"], ["occupation", "Occupation"], ["alignment", "Alignment"], ["personality", "Personality", true], ["goals", "Motivations / goals", true], ["history", "Backstory", true]],
  city: [["region", "Region"], ["government", "Government"], ["population", "Population"], ["landmarks", "Districts and landmarks", true]],
  location: [["region", "Region"], ["features", "Notable features", true], ["dangers", "Dangers", true]],
  faction: [["leader", "Leader"], ["headquarters", "Headquarters"], ["goals", "Goals", true], ["members", "Important members", true]],
  quest: [["giver", "Quest giver"], ["reward", "Reward"], ["objectives", "Objectives", true]],
  event: [["date", "In-world date"], ["participants", "Participants", true]],
  lore: [["era", "Era / date"], ["sources", "Sources", true]],
  item: [["rarity", "Rarity"], ["owner", "Owner"], ["properties", "Properties", true]],
  session: [
    ["sessionNumber", "Session number"],
    ["sessionEnd", "Session end (for grouped sessions)"],
    ["sessionDate", "In-game / real date"],
    ["sessionStatus", "Session status"],
    ["sessionHighlights", "Highlights / next steps", true]
  ],
  character: [["species", "Race"], ["occupation", "Class / profession"], ["history", "Backstory", true]],
  mechanic: [["sourcePath", "Original Obsidian path"]],
  creature: [["species", "Species"], ["status", "Status"], ["features", "Abilities", true]],
  deity: [["region", "Domain"], ["history", "Lore", true]],
  other: []
};
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[ch]);
const paragraphs = (value) => esc(value || "").replace(/\r?\n/g, "<br>");
const icon = (name) => '<i class="fa-solid ' + esc(name) + '" aria-hidden="true"></i>';
const short = (s, n = 120) => String(s || "").length > n ? String(s).slice(0, n - 1) + "…" : String(s || "");
const textField = (key, label, value, long = false) =>
  '<label class="gmh-field"><span>' + esc(label) + '</span>' +
  (long ? '<textarea name="' + esc(key) + '" rows="4">' + esc(value) + '</textarea>' :
  '<input name="' + esc(key) + '" type="text" value="' + esc(value) + '">') + '</label>';
const isGM = () => Boolean(game.user?.isGM);
const normalize = (value) => String(value || "").toLocaleLowerCase().trim();
const displayType = (type) => TYPES[type]?.[0] || "Other";
const safeType = (type) => TYPES[type] ? type : "other";
const imageSrc = (url) => /^(?!\s*(?:javascript|data):)[^\x00-\x1f]*$/i.test(String(url || "")) ? String(url || "") : "";

function cleanRecord(raw) {
  const type = safeType(raw?.type);
  const result = {
    type, tags: "", summary: "", description: "", secrets: "", image: "",
    uuid: "", related: [], key: "", body: "", sourcePath: "", sourceTitle: "", links: [], media: {}
  };
  for (const key of ["type", "tags", "summary", "description", "secrets", "image",
    "uuid", "key", "body", "sourcePath", "sourceTitle", ...COMMON_FIELDS.map((f) => f[0]), ...Object.values(TYPE_FIELDS).flatMap((fields) => fields.map(([key]) => key))]) {
    if (key === "type") continue;
    if (typeof raw?.[key] === "string") result[key] = raw[key].slice(0, key === "body" ? 1_200_000 : 50_000);
  }
  result.related = Array.isArray(raw?.related) ? raw.related.filter(v => typeof v === "string").slice(0, 100) : [];
  result.links = Array.isArray(raw?.links) ? raw.links.filter(v => typeof v === "string").slice(0, 300) : [];
  result.media = Object.fromEntries(Object.entries(raw?.media && typeof raw.media === "object" ? raw.media : {})
    .filter(([k,v]) => typeof k === "string" && typeof v === "string")
    .slice(0, 200));
  return result;
}

class GMHelpApp extends foundry.applications.api.ApplicationV2 {
  // ApplicationV2 automatically merges DEFAULT_OPTIONS through inheritance.
  // Never mutate super.DEFAULT_OPTIONS: doing so styles/breaks *all* applications.
  static DEFAULT_OPTIONS = {
    id: "gm-help-library",
    classes: ["gm-help-window"],
    window: { title: "GM Help | Averis Archive", icon: "fa-solid fa-scroll", resizable: true },
    position: { width: 1100, height: 750 }
  };

  constructor(...args) {
    super(...args);
    this.activeType = "all";
    this.search = "";
    this.selectedId = null;
    this.mode = "view";
    this.sessionFilter = "all";
  }

  get currentDoc() { return this.selectedId ? documents().find((doc) => doc.id === this.selectedId) || null : null; }
  get root() { return this.element?.querySelector(".gmh-root"); }

  async _renderHTML() {
    await loadArchive();
    const root = document.createElement("div");
    root.className = "gmh-root";
    root.innerHTML = [
      '<header class="gmh-header">',
      '<div class="gmh-brand">' + icon("fa-scroll") + '<div><strong>GM HELP</strong><small>AVERIS · PRIVATE WORLD ARCHIVE</small></div></div>',
      '<div class="gmh-actions">',
      '<button type="button" data-gmh-action="seed" title="Import the built-in Averis lore (skips existing records)">' + icon("fa-wand-magic-sparkles") + ' Averis Starter</button>',
      '<button type="button" data-gmh-action="import">' + icon("fa-file-import") + ' Import</button>',
      '<button type="button" data-gmh-action="obsidian" title="Import original D&D.zip or prepared GM Help ZIP">' + icon("fa-box-archive") + ' Import Obsidian</button>',
      '<button type="button" data-gmh-action="export">' + icon("fa-file-export") + ' Backup</button>',
      ...(legacyWorldRecords().length ? [
        '<button type="button" data-action="recover-world" title="Recover any entries saved during v0.2.0">' + icon("fa-rotate-left") + ' Recover v0.2 Notes</button>'
      ] : []),
      ...(legacyDocuments().length ? [
        '<button type="button" data-gmh-action="migrate" title="Copy v0.1 Journal records into the separate archive">' + icon("fa-copy") + ' Import Old Records</button>',
        '<button type="button" data-gmh-action="cleanup-legacy" title="Delete legacy Journal records after verified migration and backup">' + icon("fa-broom") + ' Cleanup Old Records</button>'
      ] : []),
      '<button class="gmh-primary" type="button" data-gmh-action="new">' + icon("fa-plus") + ' New Entry</button>',
      '</div></header>',
      '<div class="gmh-main">',
      '<aside class="gmh-sidebar"><div class="gmh-search">' + icon("fa-magnifying-glass") + '<input class="gmh-search-input" aria-label="Search archive" placeholder="Search names, notes, tags…" value="' + esc(this.search) + '"></div>',
      '<nav class="gmh-types">' + this.typeButtons() + '</nav>',
      '<div class="gmh-session-filters">' + this.sessionFiltersHTML() + '</div>',
      '<div class="gmh-list-heading"><strong>Entries</strong><span class="gmh-result-count"></span></div>',
      '<div class="gmh-items">' + this.listHTML() + '</div></aside>',
      '<main class="gmh-detail">' + this.detailHTML() + '</main></div>',
      '<input class="gmh-import-file" type="file" accept=".json,application/json" hidden>',
      '<input class="gmh-obsidian-file" type="file" accept=".zip,application/zip" hidden>'
    ].join("");
    return root;
  }

  _replaceHTML(result, content) { content.replaceChildren(result); }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.root;
    if (!root) return;
    root.addEventListener("click", (event) => void this.onClick(event));
    root.addEventListener("input", (event) => {
      if (!event.target.matches(".gmh-search-input")) return;
      this.search = event.target.value;
      this.drawList();
    });
    root.addEventListener("change", (event) => {
      if (event.target.matches(".gmh-import-file")) void this.importFile(event.target.files?.[0]);
      if (event.target.matches(".gmh-obsidian-file")) void this.importObsidian(event.target.files?.[0]);
      if (event.target.matches(".gmh-session-filter")) {
        this.sessionFilter = event.target.value;
        this.drawList();
      }
      if (event.target.matches("select[name=type]")) {
        const form = event.target.closest("form");
        const section = form?.querySelector(".gmh-custom-fields");
        if (section) section.innerHTML = this.customFieldsHTML(event.target.value, {});
      }
    });
    root.addEventListener("submit", (event) => {
      if (!event.target.matches(".gmh-editor")) return;
      event.preventDefault();
      void this.save(event.target);
    });
    this.drawList();
  }

  filteredDocs() {
    return documents().filter((doc) => {
      const rec = getRecord(doc);
      if (this.activeType !== "all" && rec.type !== this.activeType) return false;
      if (this.activeType === "session" && this.sessionFilter !== "all" &&
        (rec.sessionStatus || "Notes") !== this.sessionFilter) return false;
      if (!normalize(this.search)) return true;
      const searchable = [doc.name, ...Object.values(rec).flat()].join(" ");
      return normalize(searchable).includes(normalize(this.search));
    }).sort((a, b) => {
      if (this.activeType === "session" || (getRecord(a).type === "session" && getRecord(b).type === "session")) {
        const na = Number(getRecord(a).sessionNumber ?? Number.POSITIVE_INFINITY);
        const nb = Number(getRecord(b).sessionNumber ?? Number.POSITIVE_INFINITY);
        if (na !== nb) return na - nb;
      }
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });
  }

  typeButtons() {
    const all = documents();
    const buttons = [["all", "All Entries", "fa-layer-group"], ...Object.entries(TYPES).map(([key, value]) => [key, ...value])];
    return buttons.map(([key, label, glyph]) =>
      '<button type="button" data-gmh-action="type" data-type="' + key + '" class="' + (key === this.activeType ? "active" : "") + '">' +
      icon(glyph) + '<span>' + label + '</span><em>' + (key === "all" ? all.length : all.filter((d) => getRecord(d).type === key).length) + '</em></button>'
    ).join("");
  }

  sessionFiltersHTML() {
    if (this.activeType !== "session") return "";
    const options = ["all", "Notes", "Planned", "Prepared", "In Progress", "Played"];
    return '<label>Session progress <select class="gmh-session-filter">' +
      options.map(v => '<option value="' + esc(v) + '"' + (v === this.sessionFilter ? ' selected' : '') + '>' +
        esc(v === "all" ? "All sessions" : v) + '</option>').join("") +
      '</select></label>';
  }

  sessionPeers() {
    return documents().filter(d => getRecord(d).type === "session")
      .sort((a,b) => Number(getRecord(a).sessionNumber || 99999) - Number(getRecord(b).sessionNumber || 99999));
  }

  listHTML() {
    const matches = this.filteredDocs();
    if (!matches.length) return '<div class="gmh-no-results">No matching entries.<p>Create a record or import the Averis starter data.</p></div>';
    return matches.map((doc) => {
      const record = getRecord(doc);
      const art = imageSrc(record.image);
      const sessionNote = record.type === "session" ? " · " + (record.sessionStatus || "Notes") : "";
      return '<button type="button" class="gmh-entry ' + (doc.id === this.selectedId ? "active" : "") + '" data-gmh-action="select" data-id="' + esc(doc.id) + '">' +
        '<span class="gmh-thumb">' + (art ? '<img loading="lazy" src="' + esc(art) + '" alt="">' : icon(TYPES[record.type]?.[1] || "fa-folder")) + '</span>' +
        '<span class="gmh-entry-info"><strong>' + esc(doc.name) + '</strong><small>' + esc(short(record.subtitle || record.summary || displayType(record.type), 52)) + esc(sessionNote) + '</small></span>' +
        '</button>';
    }).join("");
  }

  drawList() {
    const root = this.root;
    if (!root) return;
    const list = root.querySelector(".gmh-items");
    const previousScroll = list?.scrollTop || 0;
    root.querySelector(".gmh-types").innerHTML = this.typeButtons();
    root.querySelector(".gmh-session-filters").innerHTML = this.sessionFiltersHTML();
    list.innerHTML = this.listHTML();
    list.scrollTop = previousScroll;
    root.querySelector(".gmh-result-count").textContent = this.filteredDocs().length + " shown";
  }

  drawDetail() {
    const area = this.root?.querySelector(".gmh-detail");
    if (area) { area.innerHTML = this.detailHTML(); area.scrollTop = 0; }
  }

  detailHTML() {
    if (this.mode === "edit") return this.editorHTML();
    const doc = this.currentDoc;
    if (!doc || !doc.getFlag(MODULE_ID, "record")) {
      return '<div class="gmh-empty"><div>' + icon("fa-book-open-reader") + '</div><h2>Your Campaign, One Place</h2>' +
        '<p>Select an entry to view its full details, or create a new NPC, city, faction, location or quest.</p>' +
        '<button type="button" class="gmh-primary" data-gmh-action="new">' + icon("fa-plus") + ' Create Entry</button></div>';
    }
    const r = getRecord(doc);
    const art = imageSrc(r.image);
    const peers = r.type === "session" ? this.sessionPeers() : [];
    const peerIndex = peers.findIndex(d => d.id === doc.id);
    const sessionNav = peerIndex < 0 ? "" : '<div class="gmh-session-nav">' +
      (peerIndex > 0 ? '<button type="button" data-gmh-action="select" data-id="' + esc(peers[peerIndex - 1].id) + '">' + icon("fa-chevron-left") + ' Previous Session</button>' : '') +
      '<span>Session ' + esc(r.sessionNumber || "?") + (r.sessionEnd && r.sessionEnd !== r.sessionNumber ? '–' + esc(r.sessionEnd) : "") + '</span>' +
      (peerIndex + 1 < peers.length ? '<button type="button" data-gmh-action="select" data-id="' + esc(peers[peerIndex + 1].id) + '">Next Session ' + icon("fa-chevron-right") + '</button>' : '') +
      '</div>';
    const meta = [...COMMON_FIELDS, ...(TYPE_FIELDS[r.type] || [])].filter(([key]) => r[key]);
    const related = (r.related || []).map((id) => documents().find((doc) => doc.id === id)).filter(Boolean);
    const reverse = documents().filter((x) => x.id !== doc.id && (getRecord(x).related || []).includes(doc.id));
    const linkButtons = (docs) => docs.map((x) =>
      '<button type="button" class="gmh-link" data-gmh-action="select" data-id="' + esc(x.id) + '">' +
      icon(TYPES[getRecord(x).type]?.[1] || "fa-link") + " " + esc(x.name) + '</button>').join("");
    return [
      '<div class="gmh-view">',
      '<div class="gmh-detail-toolbar"><span class="gmh-type-chip">' + icon(TYPES[r.type]?.[1] || "fa-folder") + " " + esc(displayType(r.type)) + '</span>',
      '<span class="gmh-toolbar-spacer"></span>',
      '<button type="button" data-gmh-action="edit">' + icon("fa-pen") + ' Edit</button>',
      '<button type="button" data-gmh-action="delete" class="gmh-danger">' + icon("fa-trash") + ' Delete</button></div>',
      art ? '<img class="gmh-cover" src="' + esc(art) + '" alt="Artwork for ' + esc(doc.name) + '">' : "",
      '<h1>' + esc(doc.name) + '</h1>',
      sessionNav,
      r.sourcePath ? '<div class="gmh-source-path">' + icon("fa-file-lines") + ' ' + esc(r.sourcePath) + '</div>' : '',
      r.subtitle ? '<div class="gmh-subtitle">' + esc(r.subtitle) + '</div>' : "",
      r.tags ? '<div class="gmh-tags">' + r.tags.split(",").filter(Boolean).map((t) => '<span>' + esc(t.trim()) + '</span>').join("") + '</div>' : "",
      r.summary ? '<div class="gmh-summary">' + paragraphs(r.summary) + '</div>' : "",
      meta.length ? '<dl class="gmh-meta">' + meta.map(([key, label]) =>
        '<div><dt>' + esc(label) + '</dt><dd>' + paragraphs(r[key]) + '</dd></div>').join("") + '</dl>' : "",
      r.description ? '<section class="gmh-section"><h3>Detailed Information</h3><p>' + paragraphs(r.description) + '</p></section>' : "",
      r.body ? '<section class="gmh-section gmh-md-section"><h3>' + icon("fa-file-lines") + ' Obsidian Notes</h3>' +
        '<div class="gmh-markdown">' + renderObsidianMarkdown(r.body, r, documents()) + '</div></section>' : "",
      r.secrets ? '<section class="gmh-section gmh-secret"><h3>' + icon("fa-user-secret") + ' GM Secrets & Hidden Notes</h3><p>' + paragraphs(r.secrets) + '</p></section>' : "",
      r.uuid ? '<section class="gmh-section"><h3>Linked Foundry Document</h3><button type="button" class="gmh-link" data-gmh-action="open-uuid">' +
        icon("fa-arrow-up-right-from-square") + ' Open ' + esc(r.uuid) + '</button></section>' : "",
      related.length ? '<section class="gmh-section"><h3>Connected Entries</h3><div class="gmh-links">' + linkButtons(related) + '</div></section>' : "",
      reverse.length ? '<section class="gmh-section"><h3>Referenced By</h3><div class="gmh-links">' + linkButtons(reverse) + '</div></section>' : "",
      '</div>'
    ].join("");
  }

  customFieldsHTML(type, record) {
    return (TYPE_FIELDS[safeType(type)] || []).map(([key, label, long]) => {
      if (key === "sessionStatus") return '<label class="gmh-field"><span>Session status</span><select name="sessionStatus">' +
        ["Notes", "Planned", "Prepared", "In Progress", "Played"].map(value =>
        '<option value="' + esc(value) + '"' + ((record.sessionStatus || "Notes") === value ? " selected" : "") +
        '>' + esc(value) + '</option>').join("") + '</select></label>';
      return textField(key, label, record[key] || "", long);
    }).join("");
  }

  editorHTML() {
    const doc = this.currentDoc;
    const r = doc ? getRecord(doc) : { type: this.activeType === "all" ? "npc" : this.activeType };
    const type = safeType(r.type);
    const opts = Object.entries(TYPES).map(([key, [name]]) => '<option value="' + key + '" ' + (type === key ? "selected" : "") + '>' + name + '</option>').join("");
    const relatedOpts = documents().filter((x) => x.id !== doc?.id).sort((a,b) => a.name.localeCompare(b.name))
      .map((x) => '<option value="' + esc(x.id) + '" ' + ((r.related || []).includes(x.id) ? "selected" : "") + '>' +
        esc(displayType(getRecord(x).type) + " · " + x.name) + '</option>').join("");
    return [
      '<form class="gmh-editor">',
      '<div class="gmh-detail-toolbar"><strong>' + (doc ? "Edit Entry" : "New Entry") + '</strong><span class="gmh-toolbar-spacer"></span>',
      '<button type="button" data-gmh-action="cancel">Cancel</button><button class="gmh-primary" type="submit">' + icon("fa-floppy-disk") + ' Save Entry</button></div>',
      '<div class="gmh-form-grid">',
      '<label class="gmh-field"><span>Category</span><select name="type">' + opts + '</select></label>',
      textField("name", "Name *", doc?.name || ""),
      textField("image", "Image path / URL", r.image || ""),
      '<div class="gmh-field gmh-file"><span>Choose Artwork</span><button type="button" data-gmh-action="pick-image">' + icon("fa-image") + ' Browse Foundry Files</button></div>',
      ...COMMON_FIELDS.map(([key, label]) => textField(key, label, r[key] || "")),
      textField("tags", "Search Tags (comma-separated)", r.tags || ""),
      '</div>',
      '<div class="gmh-form-full">',
      textField("summary", "Quick Summary", r.summary || "", true),
      '<h3>Category Details</h3><div class="gmh-custom-fields gmh-form-grid">' + this.customFieldsHTML(type, r) + '</div>',
      textField("description", "Detailed Information", r.description || "", true),
      textField("body", "Original Obsidian Markdown / full notes", r.body || "", true),
      textField("secrets", "GM Secrets / Hidden Notes", r.secrets || "", true),
      textField("uuid", "Linked Foundry UUID (optional)", r.uuid || ""),
      '<label class="gmh-field"><span>Related Entries (Ctrl/Cmd-click to select multiple)</span><select name="related" multiple size="6">' + relatedOpts + '</select></label>',
      '</div>',
      '<div class="gmh-form-footer"><button type="button" data-gmh-action="cancel">Cancel</button><button class="gmh-primary" type="submit">' + icon("fa-floppy-disk") + ' Save Entry</button></div>',
      '</form>'
    ].join("");
  }

  async onClick(event) {
    const button = event.target.closest("[data-gmh-action]");
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.gmhAction;
    try {
      if (action === "type") {
        this.activeType = button.dataset.type;
        this.drawList();
      } else if (action === "select") {
        if (this.mode === "edit" && !window.confirm("Discard unsaved changes?")) return;
        this.selectedId = button.dataset.id;
        this.mode = "view";
        this.drawDetail();
        this.drawList();
      } else if (action === "new") {
        if (this.mode === "edit" && !window.confirm("Discard unsaved changes?")) return;
        this.selectedId = null;
        this.mode = "edit";
        this.drawDetail();
        this.drawList();
      } else if (action === "edit") {
        if (this.currentDoc) { this.mode = "edit"; this.drawDetail(); }
      } else if (action === "cancel") {
        this.mode = "view"; this.drawDetail();
      } else if (action === "delete") {
        await this.deleteSelected();
      } else if (action === "pick-image") {
        this.pickImage();
      } else if (action === "open-uuid") {
        const uuid = getRecord(this.currentDoc).uuid;
        const doc = uuid ? await fromUuid(uuid) : null;
        if (doc?.sheet) doc.sheet.render(true);
        else ui.notifications.warn("The linked Foundry document was not found.");
      } else if (action === "seed") {
        await this.seed();
      } else if (action === "migrate") {
        await this.migrateLegacy();
      } else if (action === "recover-world") {
        await this.recoverWorld();
      } else if (action === "cleanup-legacy") {
        await this.cleanupLegacy();
      } else if (action === "export") {
        this.exportBackup();
      } else if (action === "import") {
        this.root?.querySelector(".gmh-import-file")?.click();
      } else if (action === "obsidian") {
        this.root?.querySelector(".gmh-obsidian-file")?.click();
      }
    } catch (error) {
      console.error("GM Help | Action failed", error);
      ui.notifications.error("GM Help: " + (error?.message || "Action failed. Check console."));
    }
  }

  pickImage() {
    const input = this.root?.querySelector('.gmh-editor input[name="image"]');
    if (!input) return;
    const picker = new foundry.applications.apps.FilePicker({
      type: "image", current: input.value,
      callback: (path) => { input.value = path; }
    });
    picker.render(true);
  }

  async save(form) {
    if (!isGM()) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    if (!name) { ui.notifications.warn("Entry name is required."); return; }
    const raw = Object.fromEntries(data.entries());
    raw.related = data.getAll("related");
    const original = getRecord(this.currentDoc);
    const record = cleanRecord({ ...original, ...raw });
    record.type = safeType(String(data.get("type")));
    try {
      const doc = this.currentDoc
        ? await this.currentDoc.update({ name, ["flags." + MODULE_ID + ".record"]: record })
        : await createRecord(name, record);
      this.selectedId = doc.id;
      this.activeType = this.activeType === "all" ? "all" : record.type;
      this.mode = "view";
      this.drawList();
      this.drawDetail();
      ui.notifications.info("GM Help: Saved " + name);
    } catch (error) {
      console.error("GM Help | Save failed", error);
      ui.notifications.error("Could not save entry. See console.");
    }
  }

  async deleteSelected() {
    const doc = this.currentDoc;
    if (!doc || !isGM()) return;
    if (!window.confirm('Permanently delete "' + doc.name + '"?')) return;
    await doc.delete();
    this.selectedId = null;
    this.mode = "view";
    this.drawList();
    this.drawDetail();
    ui.notifications.info("GM Help: Entry deleted.");
  }

  async addRecords(entries) {
    if (!isGM()) return { added: 0, skipped: 0 };
    const current = documents();
    const keys = new Set(current.map((d) => getRecord(d).key).filter(Boolean));
    let added = 0, skipped = 0;
    for (const entry of entries) {
      const name = String(entry?.name || "").trim().slice(0, 200);
      if (!name) { skipped++; continue; }
      const record = cleanRecord(entry.record?.type ? entry.record : entry);
      if (record.key && keys.has(record.key)) { skipped++; continue; }
      await createRecord(name, record);
      if (record.key) keys.add(record.key);
      added++;
    }
    this.drawList();
    this.drawDetail();
    return { added, skipped };
  }

  async importObsidian(file) {
    if (!file || !isGM()) return;
    const input = this.root?.querySelector(".gmh-obsidian-file");
    try {
      const bundle = await readAverisZip(file);
      ui.notifications.info(bundle.mode === "raw-vault"
        ? "GM Help: Original Obsidian vault recognized (" + bundle.payload.entries.length +
          " notes, " + bundle.payload.assets.length + " images)."
        : "GM Help: Prepared Obsidian archive recognized.");
      const count = bundle.payload.entries.length;
      const imageCount = bundle.payload.assets.length;
      if (!window.confirm("Import " + count + " private Obsidian notes and " + imageCount +
        " images into GM Help? Existing matching Obsidian notes will be skipped; you can safely re-import.")) return;
      ui.notifications.info("GM Help: Importing Obsidian notes…");
      const result = await this.addRecords(bundle.payload.entries);
      ui.notifications.info("GM Help: Imported " + result.added + " notes; skipped " + result.skipped + ". Uploading images…");
      let uploads = { uploaded: 0, failed: [] };
      if (imageCount) uploads = await uploadAverisImages(bundle, message =>
        ui.notifications.info(message));
      const imageResult = uploads.failed.length ? " Some images failed to upload: " +
        uploads.failed.length + ". You can re-import the bundle to retry." : " All images uploaded.";
      ui.notifications.info("GM Help: " + result.added + " new notes; " +
        uploads.uploaded + " images uploaded, " + (uploads.skipped || 0) +
        " already present." + imageResult, { permanent: uploads.failed.length > 0 });
      this.activeType = "session";
      this.search = "";
      this.drawList(); this.drawDetail();
    } catch (error) {
      console.error("GM Help | Obsidian bundle import failed", error);
      ui.notifications.error("GM Help Obsidian import: " + error.message);
    } finally {
      if (input) input.value = "";
    }
  }

  async seed() {
    if (!window.confirm("Import the built-in Averis NPCs, places, factions and lore? Existing imported records will not be overwritten.")) return;
    const result = await this.addRecords(AVERIS_SEED);
    ui.notifications.info("GM Help: Added " + result.added + " entries, skipped " + result.skipped + ".");
  }

  async recoverWorld() {
    if (!isGM()) return;
    const entries = legacyWorldRecords();
    if (!entries.length) { ui.notifications.info("No v0.2.0 records were found."); return; }
    if (!window.confirm("Recover " + entries.length + " v0.2.0 entries from the old world setting into the GM-private compendium?")) return;
    const result = await this.addRecords(entries);
    if (result.added + result.skipped < entries.length) {
      ui.notifications.error("Some entries were not processed. The old setting has NOT been cleared.");
      return;
    }
    if (window.confirm("Recovered " + result.added + " entries and skipped " + result.skipped + ". Clear the OLD shared world setting now? This is recommended for privacy. Your private archive entries will remain.")) {
      await clearLegacySetting();
      ui.notifications.info("GM Help: Legacy shared world setting cleared.");
    } else {
      ui.notifications.warn("Old v0.2.0 world setting still contains notes. Clear it from GM Help after verifying your archive.");
    }
  }

  async migrateLegacy() {
    if (!isGM()) return;
    const old = legacyDocuments();
    if (!old.length) { ui.notifications.info("No legacy GM Help Journal records were found."); return; }
    if (!window.confirm("Copy " + old.length + " entries from GM Help v0.1 Journal storage into the new independent archive? The original Journal entries will NOT be deleted.")) return;
    const entries = old.map((doc) => ({
      name: doc.name, ...getRecord(doc),
      key: getRecord(doc).key || ("gm-help-legacy:" + doc.id)
    }));
    const result = await this.addRecords(entries);
    ui.notifications.info("GM Help: Copied " + result.added + " entries; skipped " + result.skipped + ". Verify the records, export a backup, then use Cleanup Old Records.");
  }

  async cleanupLegacy() {
    if (!isGM()) return;
    const saved = documents();
    const old = legacyDocuments();
    // Never remove a journal unless the archived copy can be matched by import key.
    const safe = old.filter((doc) => {
      const key = getRecord(doc).key || ("gm-help-legacy:" + doc.id);
      return saved.some((candidate) => getRecord(candidate).key === key && candidate.name === doc.name);
    });
    if (!safe.length) {
      ui.notifications.warn("No safely matched legacy records. Import Old Records first.");
      return;
    }
    if (!window.confirm("Delete " + safe.length + " matched legacy GM Help Journal entries? This is permanent. First verify the new records and export your backup. Other, unmatched Journal entries will remain untouched.")) return;
    if (!window.confirm("Final confirmation: Permanently DELETE " + safe.length + " old Journal entries?")) return;
    let removed = 0;
    for (const doc of safe) { await doc.delete(); removed++; }
    ui.notifications.info("GM Help: Removed " + removed + " old Journal entries; the independent archive remains intact.");
  }

  exportBackup() {
    const data = {
      format: "gm-help", version: 1, exported: new Date().toISOString(),
      entries: documents().map((doc) => ({ name: doc.name, ...getRecord(doc) }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gm-help-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async importFile(file) {
    if (!file || !isGM()) return;
    try {
      if (file.size > 5_000_000) throw new Error("Backup is larger than 5 MB.");
      const parsed = JSON.parse(await file.text());
      if (parsed?.format !== "gm-help" || !Array.isArray(parsed.entries)) throw new Error("Not a GM Help backup.");
      if (parsed.entries.length > 2000) throw new Error("Maximum import is 2,000 entries.");
      if (!window.confirm("Import " + parsed.entries.length + " backup entries? Records with matching import keys will be skipped.")) return;
      const result = await this.addRecords(parsed.entries);
      ui.notifications.info("GM Help: Imported " + result.added + ", skipped " + result.skipped + ".");
    } catch (error) {
      console.error("GM Help | Import failed", error);
      ui.notifications.error("GM Help import failed: " + error.message);
    } finally {
      const input = this.root?.querySelector(".gmh-import-file");
      if (input) input.value = "";
    }
  }
}

let appInstance;
function openHelp() {
  if (!isGM()) { ui.notifications.warn("GM Help is only available to the Game Master."); return; }
  if (!appInstance) appInstance = new GMHelpApp();
  appInstance.render(true);
}
Hooks.once("init", () => {
  registerLegacySetting();
  game.settings.registerMenu(MODULE_ID, "open", {
    name: "GM Help Archive",
    label: "Open GM Help",
    hint: "Private GM encyclopedia for NPCs, cities, factions, quests and world lore.",
    icon: "fa-solid fa-scroll",
    type: GMHelpApp,
    restricted: true
  });
});
Hooks.once("ready", () => {
  if (!isGM()) return;
  game.gmHelp = { open: openHelp, version: "0.4.0" };
});


/* Foundry V14 public Scene Controls extension point. Only creates the GM Help
 * control; never manipulates DOM/CSS or Monk's controls. */
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM || !controls || controls.gmHelp) return;
  const maxOrder = Math.max(0,...Object.values(controls).map(c => Number(c.order) || 0));
  controls.gmHelp = {
    name: "gmHelp",
    title: "GM Help — Averis Encyclopedia",
    icon: "fa-solid fa-scroll",
    order: maxOrder + 1,
    visible: true,
    onChange: (event, active) => { if (active) openHelp(); },
    tools: {
      open: {
        name: "open",
        title: "Open GM Help",
        icon: "fa-solid fa-scroll",
        order: 0,
        button: true,
        visible: true,
        onChange: () => openHelp()
      }
    }
  };
});

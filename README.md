# GM Help — Averis World Encyclopedia

**Version 0.2.0** — isolated, GM-only encyclopedia for **Foundry VTT v14** and **DnD5e 5.3.3**. Designed not to interfere with Monk's Enhanced Journal.

## 0.2.0 Critical compatibility fix

Version 0.1.0 accidentally merged into the superclass ApplicationV2 default options. Since Foundry's merge function can mutate its first argument, this contaminated shared parent configuration with GM Help's CSS class, color scheme, window size and title. It could make unrelated Foundry/Monk's windows turn blue or behave strangely.

**Fixed in 0.2.0:**
- Define subclass-only static DEFAULT_OPTIONS; never alter super.DEFAULT_OPTIONS.
- Anchor all module CSS selectors to the unique #gm-help-library window. No page-level/global selectors.
- Stop inserting buttons into JournalDirectory or listening to Journal document create/update/delete events.
- Separate GM Help records from native Journals into a hidden **world setting**. Creating NPCs, cities and factions no longer triggers other journal-enhancement modules.
- Give custom UI click actions a data-gmh-action namespace so they do not interfere with ApplicationV2's built-in data-action handling.
- Switch to a neutral charcoal/bronze palette **inside GM Help only**.

**Important:** Install the update and **fully reload the Foundry browser client** (Ctrl+F5 or reopen the world). The old module may already have changed in-memory ApplicationV2 options; only a fresh client startup clears that old memory.

## Features

- GM-only searchable encyclopedia for **NPCs, Cities, Locations, Factions, Quests, Events, World Lore, Important Items** and Other records.
- Category-specific fields (character backstory, personality, faction, goals; city government, population; faction leaders, etc.).
- Optional artwork, tags, secret DM notes and Foundry UUID references.
- Related entries, reverse links and real-time search.
- **Averis Starter**: 67 editable lore outlines, imported once per unique key and not overwritten on subsequent imports.
- JSON backup/export and import. **Export regularly to protect your campaign notes.**

## Install & update

Use **Add-on Modules → Install Module → Manifest URL**:

https://raw.githubusercontent.com/Daikaze/Gm-Help/main/module.json

Alternatively download the GitHub ZIP, extract to the Foundry Data modules folder, and ensure that Data/modules/gm-help/module.json exists.

Enable under Manage Modules, then open **Game Settings → Configure Settings → Module Settings → GM Help → Open GM Help** as a GM.

## Migrating existing 0.1.0 records

Version 0.1.0 placed entries in the native Journal directory under **GM Help | Secret Archive**. Version 0.2.0 **does not** modify those old entries automatically.

1. Update GM Help to v0.2.0 and **fully reload** your Foundry client.
2. Open GM Help via Module Settings.
3. If old GM Help Journal entries exist, select **Import Old Records**. This copies them to the new independent archive, leaving originals untouched.
4. Verify imported entries and click **Backup** to export a JSON copy.
5. If desired, select **Cleanup Old Records**; this permanently deletes **only** matched legacy GM Help Journal entries after two explicit confirmations. Unmatched Journal records are never deleted.

Do not manually delete legacy entries before migrating and exporting a backup.

## Storage and access

- New records are stored in the world-level gm-help.records setting as a JSON string, not JournalEntry documents.
- Game masters can read and modify those records. The GM Help application and Module Settings launcher are restricted to GM.
- Data survives module updates and can be restored via Import; deleting the setting manually destroys stored data.
- JSON backups include **GM-only secrets**; store them privately.
- There are no JournalDirectory render hooks, page-level CSS overrides, Monk's API calls or modifications of other modules.
- This setting-based store is suitable for a moderate campaign encyclopedia. Very large libraries may require a dedicated pack or storage design in a later release.

## Compatibility and limitations

Foundry VTT **v14** / DnD5e **5.3.3** target. Script syntax, storage CRUD, isolated ApplicationV2 inheritance and rendering logic have been checked in a simulated environment; the update still needs live verification inside your installed Foundry world with Monk's enabled.

Repository: https://github.com/Daikaze/Gm-Help

# GM Help v0.3.0 — Averis Encyclopedia

GM-only encyclopedia for **Foundry VTT v14** and DnD5e 5.3.3.

## New features

- **Sessions** category, numeric sorting for session numbers and fractional sessions (32.5, 36.5).
- Editable session status: Notes, Planned, Prepared, In Progress, Played. Date and Highlights fields.
- Previous / Next Session navigation, status filter.
- Preserves full text and Obsidian Markdown of imported notes (including headings, tables, DC checks, callouts, wiki links and DM notes).
- Left-side **GM Help book icon** in Foundry scene controls for GMs via official v14 getSceneControlButtons extension hook.
- **Obsidian ZIP** button to import the private Averis data bundle without publicly posting the data to GitHub.
- New categories: Characters, Sessions, Mechanics, Creatures, Deities.
- Retains GM-only compendium storage, isolated CSS, saved records, import/export, and previous migration tools.

## Private Averis Obsidian data

The user's supplied vault contains **140 Markdown files**, including **28 session logs**, and **74 images**. The processed private import file is called **Averis_GM_Help_Import.zip**.

**The complete campaign data and art are not committed to this public GitHub repository.** Download the separate private ZIP from the ChatGPT conversation.

### Import

1. Download Averis_GM_Help_Import.zip from the conversation.
2. Update GM Help to v0.3.0, enable the module, and fully reload the Foundry world.
3. As GM, click the **book icon** in Foundry left Scene Controls. Or use Game Settings → Configure Settings → Module Settings → GM Help.
4. In GM Help click **Obsidian ZIP**, choose the prepared ZIP, and confirm.
5. GM Help copies your notes to the GM-restricted world compendium and uploads WebP images to Foundry User Data: gm-help/obsidian-assets.
6. Select Sessions, open a session and edit its status. Use **Backup** for periodic JSON backups.

**Do not unzip the private ZIP to install it as a module.** The ZIP importer accepts the prepared STORE-format ZIP only, not arbitrary deflated Obsidian vault ZIPs. Image upload requires the GM to have permission to write to Foundry User Data.

### Preservation and limitations

- **140 original markdown source files** are preserved in their imported record bodies; importer skips existing matching keys and never overwrites edits.
- Source paths and wiki-link targets are stored; source text can be edited without truncating lore.
- Obsidian-only plugins such as Meta Bind and Dataview are not executed. Markdown formatting is rendered safely in a built-in viewer.
- **74 optimized WebP images** are stored in Foundry User Data. Keep the private ZIP to restore images: JSON-only Backup contains metadata/notes but not picture bytes.
- GM Help is private, but images served from User Data are not encrypted.
- A few ambiguous Obsidian wiki-links or reference images may need manual adjustments.
- The supplied vault has no separate dedicated city folder; the City category is available for future additions.

## Update

Manifest URL: https://raw.githubusercontent.com/Daikaze/Gm-Help/main/module.json

**After updating fully reload the Foundry browser/client.** GM Help v0.1.0 caused an inherited ApplicationV2 default option mutation which could turn unrelated windows blue and interfere with Monk's Enhanced Journal. This is fixed: GM Help does not mutate parent options, and all CSS selectors are isolated to #gm-help-library.

The icon is added through the official Foundry v14 Scene Controls hook. No Monk's code, existing controls, JournalDirectory DOM or external CSS are changed.

## Migrating older versions

Old v0.1.0 GM Help Journal records may be copied with Import Old Records and optionally cleaned up after verifying and backing up. The brief v0.2.0 world setting can be recovered with Recover v0.2 Notes. Updates never automatically delete older notes.

## Testing

JavaScript syntax and simulated Foundry compendium operations, session sorting/filtering, markdown link rendering and left control registration were checked. A live Foundry v14 test with Monk's is still needed.

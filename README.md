# GM Help — Averis World Encyclopedia

A **GM-only**, searchable campaign encyclopedia for **Foundry VTT v14** (designed for **DnD5e system 5.3.3**). Version **0.1.0**.

## Features

- Create, edit, delete, search and filter **NPCs, Cities, Locations, Factions, Quests, Events, World Lore, Important Items** and **Other** records.
- Custom fields by category, searchable tags, detailed descriptions, confidential GM notes, character/scene Journal or Actor UUID links, image paths and relationships between records.
- Responsive dark-mode browser with artwork, clickable cross-references and reverse references.
- **Averis Starter** button imports **67** outlines from established campaign context, including Aegon, Refana, Radev, Rosalia, Hercules, House Krat, Ravda, Coralspire and the four planar barriers. It **skips** existing entries with matching import keys, **never overwrites** your edits.
- Import and export portable JSON backups of the archive.
- Stored as world **JournalEntry** documents in the **GM Help | Secret Archive** folder, with **NONE default ownership**, so players do not see the records. No cloud service or API keys.

## Install

1. In Foundry VTT v14, open **Add-on Modules → Install Module → Manifest URL** and try:
   https://raw.githubusercontent.com/Daikaze/Gm-Help/main/module.json
2. If GitHub archive installation fails (due to the GitHub ZIP root folder name), use **Code → Download ZIP** in this repository, unzip and rename its root folder to **gm-help**, then place it inside Foundry's Data/modules directory. The file **module.json** must be directly inside **Data/modules/gm-help/**.
3. Enable **GM Help** in **Manage Modules** within the campaign world.
4. As GM: Open **Game Settings → Configure Settings → Module Settings → GM Help → Open GM Help**. A shortcut may also appear in the **Journal** sidebar header.
5. Click **Averis Starter** to import the initial campaign outlines. You can edit every record and add artwork.

**Important:** The archive is visible only to users with GM role in this initial release. Do not grant players manual ownership of its underlying Journal Entries, or they may see them through the normal Journal interface. JSON backups contain GM secrets; store them privately.

## Usage

- **New Entry:** Select a category (or leave All), click New Entry, fill the name and details, then Save.
- **Search:** Searches names, summaries, descriptions, tags and metadata within the current category.
- **Artwork:** Use Browse Foundry Files or paste a local file path / HTTPS URL.
- **Connections:** Multi-select related entries in the editor (Ctrl/Cmd-click). The linked entries become clickable in detail view.
- **Foundry UUID:** Put a UUID such as Actor.abc123 or Scene.abc123 in the linked document field to open it from GM Help.
- **Backup:** Export all records as a JSON file. **Import:** Add records from a GM Help JSON backup. Existing seed keys are not duplicated.
- **Data:** Updates remain in your world Journal database even after updating or disabling the module, though the custom display UI requires the module.

## Compatibility and development

Targets Foundry **14** and uses the native **ApplicationV2**, JournalEntry documents and FilePicker API. This is an initial implementation; it has not been tested live inside the user's installed Foundry client yet. The module is system-agnostic, with DnD5e 5.3.3 as its intended campaign environment.

Suggested next steps: richer relationship graph, integrated actor/scene importer, collapsible timelines, location maps, better rich-text editor, optional quick-access token context menu.

Repository: https://github.com/Daikaze/Gm-Help

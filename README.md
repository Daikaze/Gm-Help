# GM Help v0.4.0 — Averis Encyclopedia

A private GM encyclopedia module for **Foundry VTT v14** / **DnD5e 5.3.3**.

## v0.4.0 — Direct Obsidian ZIP import (Option B)

GM Help can now import the **original Obsidian vault ZIP** directly, e.g. **D&D.zip**, without any repackaging, in addition to the prepared Averis_GM_Help_Import.zip.

- Accepts standard ZIP compression methods **STORE (0)** and **DEFLATE (8)** via native browser DecompressionStream.
- Reads the ZIP directory and processes files **one at a time**, without loading the complete 199 MB file into memory.
- Imports all Markdown notes from the vault into a **GM-private world compendium**.
- Automatically categorizes notes (Sessions, NPCs, Characters, Factions, Lore, Locations, Items, Mechanics, Creatures).
- Extracts session numbers, ranges and fractional numbers; keeps session ordering, statuses and navigation.
- Detects Obsidian wiki-links, pictures and relative source paths.
- Converts pictures one at a time into **1280px WebP** using the Foundry browser and uploads them into Data/gm-help/obsidian-assets.
- Skips Obsidian configuration, plugin scripts, nested ZIP files and system metadata.
- Checks ZIP entry CRC, path traversal, entry count and decompression limits.
- Deduplicates notes using source path SHA-1 keys consistent with earlier prepared imports.
- Keeps entire long Markdown source in records (previous versions accidentally truncated source text at 50,000 characters).
- **Scroll icon** (fa-scroll) in the Foundry left Scene Controls palette, Module Settings and GM Help title.
- Retains the earlier fixes preventing global CSS contamination and Monk's Enhanced Journal interaction.

## Import the original D&D.zip

1. In **Add-on Modules**, update GM Help to **v0.4.0**.
2. Close/reopen the Foundry world and reload the browser, especially if you previously used v0.1.0.
3. As GM, click the **scroll icon** in the left scene tools or open **Game Settings > Module Settings > GM Help**.
4. Choose **Import Obsidian**, select your **original D&D.zip** (199 MB) and confirm.
5. The module imports the notes into the restricted **GM Help | Private Archive** world compendium and processes picture uploads sequentially.
6. Open Sessions to view and edit each session. Use the Backup button for JSON backups.

The original vault ZIP itself is **not uploaded** to the server or GitHub: Foundry reads it in your browser. Only the extracted notes and converted images go into your own Foundry world. Private campaign content is NOT committed to this public repository.

## What the provided D&D.zip contains

Based on inspection of the uploaded archive: **140 Markdown documents, 28 session files and 74 images**. The archive also contains configuration files and one nested ZIP, which the importer intentionally ignores.

## Safety and limitations

- Maximum source ZIP 500 MB, 5,000 ZIP entries, 1,200 Markdown notes, 400 images, and 500 MB selected uncompressed contents.
- Maximum individual Markdown note 1.2 MB, image 35 MB.
- Requires a recent browser supporting native DecompressionStream('deflate-raw') and WebP canvas encoding.
- If individual images fail to upload, imports of notes can still succeed; re-importing the same ZIP retries missing images without overwriting existing notes.
- Foundry **User Data images are not encrypted**, so do not publish their paths for DM-only spoilers.
- Obsidian HTML, Dataview, Meta Bind and JavaScript are not executed by the viewer; complex layouts may render differently.
- JSON Backup includes note metadata and links but not the binary images; retain the original ZIP too.
- A live test with the user's exact Foundry V14 build and Monk's Enhanced Journal is still required.

## Compatibility with prior versions

Existing GM Help compendium notes are retained. Notes previously imported from prepared bundles will not be duplicated because original vault paths use the same stable import keys.

The v0.1.0 Import Old Records and v0.2.0 Recover v0.2 Notes tools remain available. No global stylesheet is applied, and no Monk's or native JournalDirectory UI is patched.

## Install manifest

https://raw.githubusercontent.com/Daikaze/Gm-Help/main/module.json

Source: https://github.com/Daikaze/Gm-Help

# GM Help — Averis Encyclopedia

**GM Help v0.2.1** targets **Foundry VTT v14** and **DnD5e 5.3.3**.

A private, searchable encyclopedia for your D&D campaign. No patches to Foundry or Monk's Enhanced Journal are installed.

## Critical UI bug fixed

Version 0.1.0 inadvertently called mergeObject on the shared superclass ApplicationV2.DEFAULT_OPTIONS. This could inject the GM Help blue theme and other window options into *all* Foundry windows, including Monk's.

Fixes:
- Only defines GMHelpApp.DEFAULT_OPTIONS; does not mutate superclass options.
- All CSS is scoped to the single #gm-help-library application window.
- Removed every JournalDirectory render hook and any insertion of buttons into other modules.
- Uses private data storage in a GM-restricted **WORLD COMPENDIUM** named "GM Help | Private Archive" (not a shared world setting and not game.journal).
- The separate archive uses permissions PLAYER=NONE, TRUSTED=NONE, ASSISTANT=NONE, GAMEMASTER=OWNER.
- Custom click actions use a private data-gmh-action attribute instead of Foundry's reserved data-action.
- Uses neutral charcoal and bronze within its own window, without changing Foundry's appearance.

**After updating, close and fully reopen the Foundry world/browser client** (Ctrl+F5 can help). Previous versions may already have changed in-memory shared options; a full reload clears them.

## Features

- NPC, city, location, faction, quest, event, lore and item entries.
- Search names, tags and descriptions.
- Category-specific info, DM secrets, artwork, connected entries and Foundry UUID links.
- New/edit/delete actions.
- Import/export JSON backup.
- Averis Starter: 67 example lore records, imported on demand and never overwritten by repeat starter imports.

## Installation

In Add-on Modules → Install Module, use:

https://raw.githubusercontent.com/Daikaze/Gm-Help/main/module.json

Enable the module in Manage Modules. Open as GM via:

Game Settings → Configure Settings → Module Settings → GM Help → Open GM Help.

No Journal sidebar button is inserted (intentional for Monk's compatibility).

## Migrating GM Help v0.1.0 notes

The original v0.1.0 archive was the world Journal folder "GM Help | Secret Archive". Version 0.2.1 does **not** delete or edit those records automatically.

1. Open GM Help v0.2.1.
2. Click **Import Old Records** to copy existing GM Help Journal entries to the private world compendium.
3. Confirm the copied notes and export JSON via **Backup**.
4. Optionally click **Cleanup Old Records**. This only deletes matching original GM Help Journal entries, after two confirmations.

Other journals are not touched.

## Migrating the brief v0.2.0 version (shared world setting)

If records were saved while v0.2.0 was installed, click **Recover v0.2 Notes**. This copies them into the private compendium. The module then offers to **clear the old shared world setting**, recommended for privacy. Verify the newly copied records and save a Backup before purging.

## Data and privacy

The app and actions are GM-only. New documents live in a restricted **world** compendium, which survives module updates. Unlike module compendium files, the world compendium is not overwritten by updating this module. Do not manually delete the private compendium without making a JSON backup. The backup includes GM secrets and should be stored privately.

The app does not install JournalDirectory hooks, does not change document ownership of unrelated records, does not patch Monk's code, and does not apply global CSS. For very large archives, compendium access may take additional time.

## Testing

The JavaScript syntax, private archive create/update/delete behavior, permission configuration, inheritance isolation and main rendering logic were checked with simulated Foundry APIs. **Live verification in the user's Foundry v14 installation with Monk's enabled is still required.**

Repository: https://github.com/Daikaze/Gm-Help

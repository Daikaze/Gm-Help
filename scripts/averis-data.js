/**
 * Optional starter records taken from established Averis campaign notes.
 * These are outlines, intentionally not invented full biographies.
 * Import is manual and idempotent; editing an imported record never changes the source data.
 */
const NPC = [
  ["Vlado", "Guardian of the barriers who appeared as a hologram and requested help from the party.", "Appeared during the opening forest encounter. He is associated with the world's magical barriers.", { occupation: "Barrier guardian", status: "Known" }],
  ["Aegon", "Refana's father and a descendant of Draven Mortrusk.", "The party encountered him in Ravda. He recognized and explained elements of Rashira's mark and was essential to the ritual and Refana's rescue.", { location: "Ravda", status: "Alive", history: "Descendant of Draven Mortrusk." }],
  ["Refana", "Aegon's daughter, kidnapped during the early cave storyline.", "Her disappearance was central to the goblin arc. The party eventually found her after navigating the labyrinth.", { status: "Rescued" }],
  ["Helga Von Doom", "Noblewoman associated with the manor and the party's early travel.", "Provided a cart in the early arc. She later expressed distrust toward Erika.", { location: "Helga's Manor", occupation: "Noble" }],
  ["Radev", "Captain of the Hounds involved in military and security operations.", "Assigned the party to guard a camp. Has connections to the conflict between North and South.", { faction: "Black Hounds", occupation: "Captain" }],
  ["Vasko", "Known Averis NPC.", "Additional biography and affiliations have yet to be established."],
  ["Mura", "Merchant / specialist associated with a new game mechanic and magical affinities.", "In the early mid-campaign arc, Mura told Rashira that she had a second affinity, with a three-day timetable.", { occupation: "Shopkeeper / specialist" }],
  ["Father Miro", "Religious figure associated with Izanami.", "The party met Father Miro at the church. Izanami is linked to death.", { occupation: "Priest", faction: "Church of Izanami" }],
  ["Valendur Kolhard", "Character associated with the Academy.", "Further details can be added as the Academy storyline develops.", { location: "Academy" }],
  ["Rex — The Ash Tyrant", "A figure known as 'The Ash Tyrant' and connected to the Yonko.", "Also described as a relative in the campaign's NPC notes. Specific relationship details are not yet recorded.", { faction: "Yonko", status: "Known" }],
  ["General Azis", "Goblin general who negotiated with the captured party.", "Instructed the party to bring Aegon alive from Ravda.", { faction: "Goblins", occupation: "General", location: "Goblin Camp" }],
  ["Krenkoto", "Enemy from the early goblin / labyrinth storyline.", "Krenkoto died during the early boss arc.", { status: "Deceased" }],
  ["Valentino", "Leader or prominent figure of the Black Panthers.", "The Black Panthers are tied to a doppelganger conspiracy. Most members were later revealed to be doppelgangers.", { faction: "Black Panthers", status: "Known" }],
  ["Draven Mortrusk", "Ancestor of Aegon; a tomb bearing his name was found in the cave.", "His legacy is connected to Refana and the Mortrusk bloodline.", { status: "Historical", history: "Aegon is his descendant." }],
  ["Andrea Mortrusk", "Mortrusk family figure whose grave was encountered.", "The party came across Andrea Mortrusk's grave during the early arc.", { status: "Historical" }],
  ["Rosalia", "Important ally associated with affinities and the Broken Barrier storyline.", "Offered second affinity opportunities to Sunless and Noctis. Was present with Aegon and Radev in the duergar encounter.", { status: "Known" }],
  ["Hercules", "One of several commanders of the Black Hounds.", "Gifted Rashira a Tempus Watch during the celebration. Hercules is not the sole commander of the Black Hounds.", { faction: "Black Hounds", occupation: "Commander" }],
  ["Randy", "A Reaper previously banished by Aegon.", "Mura revealed that Randy was a Reaper who had been banished for two years. Randy is NOT established as being Rashira's scythe.", { status: "Known" }],
  ["Rasho", "Guard associated with Radev and the Missing Soldier storyline.", "Dimir made an Arcana check with Rasho during an earlier session.", { occupation: "Guard" }],
  ["Zhecho", "Blacksmith known to the party.", "Can be expanded with shop details, stock and personal connections.", { occupation: "Blacksmith" }],
  ["Jerra", "Paladin involved in the guard-camp and ambush storyline.", "The party encountered Jerra during Radev's mission. Jerra later appeared in an ambush with bandits.", { occupation: "Paladin" }],
  ["Bori", "Person rescued in the Black Iron cave storyline.", "The party freed Bori in the events following Session 22.", { status: "Rescued" }],
  ["Saniel Krat", "Rashira Krat's father and a descendant of the original guardian history.", "One of the four surviving guardians named in ancient lore, later affected by erased memories. Rashira's parents were expected to arrive shortly after Session 22.", { faction: "House Krat", location: "Coralspire" }],
  ["Rexalia Krat", "Rashira Krat's mother.", "Lives within the House Krat family context in Coralspire. She was expected to arrive with Saniel after Session 22.", { faction: "House Krat", location: "Coralspire" }],
  ["Rudeus Krat", "Rashira's young brother.", "Recorded as four years old in established campaign notes.", { faction: "House Krat", location: "Coralspire" }],
  ["Volheim Krat", "Founder of House Krat around five hundred years before the current era.", "His legacy is tied to the fall of Ragamodji and the House Krat storyline.", { faction: "House Krat", status: "Historical" }],
  ["Chem", "Known figure associated with a house visited by the party.", "Mentioned together with Rumpel in Session 12."],
  ["Rumpel", "Known figure associated with a house visited by the party.", "Mentioned together with Chem in Session 12."],
  ["Sister Vaska", "Character who appeared in Session 15.", "Details can be expanded as the plot develops."],
  ["Betori", "Figure associated with the magical affinity storyline.", "Further details have not yet been established."],
  ["Krazeth — The Ash Devourer", "A rumored threat associated with the 'Ash Devourer' storyline.", "The related quest is currently on hold in the campaign notes.", { status: "Rumored" }]
];
const PLACES = [
  ["city", "Ravda", "Village where Aegon was found.", "The party traveled here while pursuing the goblin general's request. Locations included a church, an inn and a blacksmith.", { region: "Material Plane", status: "Visited" }],
  ["city", "Coralspire", "Home of House Krat and Rashira's family.", "Associated with Saniel, Rexalia, Rudeus and the legacy of the Krat bloodline.", { status: "Established" }],
  ["location", "The Academy", "Educational institution linked to Valendur Kolhard.", "An important location that can be expanded as the party explores it.", { status: "Known" }],
  ["location", "The Goblin Cave", "Multi-floor cave central to the first campaign arc.", "Level one contained goblin activity, level two ore and a Day 42 blood note, and level three the tomb of Draven Mortrusk.", { features: "Three levels; ore floor; Draven Mortrusk tomb", status: "Visited" }],
  ["location", "The Labyrinth", "Dangerous site with coffins where Refana was located.", "The party navigated the labyrinth during the rescue arc.", { status: "Visited" }],
  ["location", "Helga's Manor", "Estate associated with Helga Von Doom.", "An important stop during the early campaign.", { status: "Known" }],
  ["location", "Goblin Camp", "Camp controlled by General Azis's forces.", "The party was taken captive by goblins and negotiated with General Azis.", { faction: "Goblins", status: "Visited" }],
  ["location", "Church of Izanami", "Church where Father Miro was encountered.", "Religious site associated with Izanami, the deity of death.", { status: "Visited" }],
  ["location", "Sudjuk Cave", "Cave used following the Session 22 events.", "A former prisoner who decided to oppose the Black Panthers was moved here.", { status: "Known" }],
  ["location", "Feywild Portal", "Portal tied to Dimir's personal storyline.", "The portal was almost ready by Session 20.", { status: "In Progress" }]
];
const FACTIONS = [
  ["Black Hounds", "Military organization with several commanders.", "Radev is a captain; Hercules is one of multiple commanders overseeing different forces, regions or operations.", { members: "Radev; Hercules", status: "Active" }],
  ["Black Panthers", "Faction linked to Valentino and widespread doppelganger infiltration.", "A prisoner transformed into a doppelganger and revealed that most Black Panthers were doppelgangers.", { leader: "Valentino", status: "Active", secrets: "The party learned that most members are doppelgangers." }],
  ["ANBU", "Underground criminal organization dealing in slavery and illicit trade.", "Operates in black-market dealings and the trafficking of enslaved people. Led by a dangerous, morally corrupt figure.", { goals: "Black-market dealings and slave trading", status: "Active" }],
  ["House Krat", "Noble / magical family based in Coralspire.", "Founded by Volheim Krat around five hundred years ago. Rashira is a member; Saniel and Rexalia are her parents.", { headquarters: "Coralspire", leader: "Saniel and Rexalia Krat", status: "Active" }],
  ["Yonko", "Influential power group linked to the Ash Tyrant.", "Rex, known as The Ash Tyrant, is associated with the Yonko.", { members: "Rex — The Ash Tyrant" }],
  ["Valentria Clan", "One of the named Feywild clans.", "Specific political and cultural details are to be established.", { headquarters: "Feywild" }],
  ["Eldrain Clan", "One of the named Feywild clans.", "Specific political and cultural details are to be established.", { headquarters: "Feywild" }],
  ["Akatsuba Clan", "One of the named Feywild clans.", "Specific political and cultural details are to be established.", { headquarters: "Feywild" }],
  ["Tsukiyori Clan", "One of the named Feywild clans.", "Specific political and cultural details are to be established.", { headquarters: "Feywild" }]
];
const LORE = [
  ["Four Planar Barriers", "The Material, Feywild, Shadowfell and Ethereal barriers protect reality.", "Ancient forces attempted to break these four boundaries and release darkness.", { era: "Ancient history" }],
  ["Yggsadril", "Ancient tree whose branches and magic held darkness back.", "Yggsadril helped protect the four barriers from the forces threatening the world.", { era: "Ancient history" }],
  ["Ten Guardians", "Elite ten guardians created to protect the world.", "The last named guardians were Saniel, Feru, Aaspaar and Daiki, who later lost their memories due to powerful magic.", { era: "Ancient history" }],
  ["Year 1024", "Current year in the Averis campaign.", "Use this as the timeline anchor for future campaign entries.", { era: "1024" }],
  ["Ragamodji's Fall", "Formerly a good god of war who fell into demonhood.", "His fall followed the murder of his family by people connected to Volheim Krat.", { status: "Historical" }],
  ["The Mark of Rashira", "Three-part mark related to tracking, defense and observation.", "The mark's known functions are Tracking, Defence and Eyeing. It reacts to the word 'goblin'.", { status: "Known", secrets: "An attempt to split the mark to Dimir failed." }],
  ["Mana Affinities", "Campaign-specific magical growth system.", "Affinities include Fire, Earth, Wind, Water, Lightning, Psychic, Necrotic, Poison, Acid, Radiant, Ice, Force, Thunder and Blood.", { status: "Homebrew Rule" }],
  ["Doppelganger Conspiracy", "Revelation concerning the Black Panthers.", "A transformed prisoner indicated that most Black Panthers were doppelgangers.", { status: "Discovered" }],
  ["Fujin", "God associated with wind.", "Dimir's blessing storyline used Religion checks of DC 10, 13 and 16.", { status: "Deity" }],
  ["Izanami", "Deity associated with death.", "Father Miro's church is linked to Izanami.", { status: "Deity" }],
  ["Selune", "Deity present in the Averis pantheon.", "Details to be expanded through campaign lore.", { status: "Deity" }],
  ["Hikari", "Celestial Light divinity.", "Associated with a light symbol on the shoulder.", { status: "Deity" }]
];
const QUESTS = [
  ["Broken Barrier", "Main quest about stabilizing or restoring the barriers.", "Quest-board progress was approximately 80%; Rosalia was associated with it.", { status: "80% — In Progress", giver: "Rosalia" }],
  ["War Between North and South", "Conflict linked to Radev and regional forces.", "Quest-board progress was approximately 60%.", { status: "60% — In Progress", giver: "Radev" }],
  ["Missing Soldier", "Investigation linked to Rasho and Radev.", "Quest-board progress was approximately 40%.", { status: "40% — In Progress", giver: "Rasho / Radev" }],
  ["The Ash Devourer", "Plotline concerning Krazeth.", "Quest-board progress was approximately 20% and later put on hold.", { status: "20% — On Hold" }],
  ["Legacy of House Krat", "Character / family arc about the Krat bloodline.", "Related to Rashira, Coralspire, Volheim Krat and the tragic history of Ragamodji.", { status: "Active" }]
];

let index = 0;
const entry = (type, name, summary, description, extras = {}) => {
  index += 1;
  return { key: "averis-v1-" + index, type, name, summary, description, ...extras, tags: "Averis, campaign canon" };
};
export const AVERIS_SEED = [
  ...NPC.map(([name, summary, description, extra]) => entry("npc", name, summary, description, extra)),
  ...PLACES.map(([type, name, summary, description, extra]) => entry(type, name, summary, description, extra)),
  ...FACTIONS.map(([name, summary, description, extra]) => entry("faction", name, summary, description, extra)),
  ...LORE.map(([name, summary, description, extra]) => entry("lore", name, summary, description, extra)),
  ...QUESTS.map(([name, summary, description, extra]) => entry("quest", name, summary, description, extra))
];

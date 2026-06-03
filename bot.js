const { Client, GatewayIntentBits, Partials } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

const OWNER_ID = process.env.OWNER_ID;

let db = require("./database.json");

/* =========================
   SAVE DB
========================= */
function saveDB() {
  fs.writeFileSync("./database.json", JSON.stringify(db, null, 2));
}

/* =========================
   USER SAFE INIT
========================= */
function getUser(id) {
  if (!db.users[id]) {
    db.users[id] = {
      coins: 0,
      xp: 0,
      level: 1,
      prestige: 0,
      reputation: 0,
      messages: 0,
      voice: 0,
      team: null,
      marriage: null,
      joined: Date.now(),
      mission: null
    };
  }
  return db.users[id];
}

/* =========================
   LOAD MODULES
========================= */
require("./bot2")(client, db, saveDB, getUser);
require("./bot3")(client, db, saveDB, getUser);
require("./bot4")(client, db, saveDB, getUser);
require("./bot5")(client, db, saveDB, getUser);
require("./bot6")(client, db, saveDB, getUser);
require("./bot7")(client, db, saveDB, getUser);
require("./bot8")(client, db, saveDB, getUser);
require("./bot9")(client, db, saveDB, getUser);
require("./bot10")(client, db, saveDB, getUser);
require("./bot11")(client, db, saveDB, getUser);

/* =========================
   READY
========================= */
client.once("ready", () => {
  console.log(`Homelander online: ${client.user.tag}`);
});

/* =========================
   LOGIN
========================= */
client.login(process.env.TOKEN);

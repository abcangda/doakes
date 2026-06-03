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
console.log("bot2:", typeof require("./bot2"));
console.log("bot3:", typeof require("./bot3"));
console.log("bot4:", typeof require("./bot4"));
console.log("bot5:", typeof require("./bot5"));
console.log("bot6:", typeof require("./bot6"));
console.log("bot7:", typeof require("./bot7"));
console.log("bot8:", typeof require("./bot8"));
console.log("bot9:", typeof require("./bot9"));
console.log("bot10:", typeof require("./bot10"));
console.log("bot11:", typeof require("./bot11"));

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

const fs = require("fs");
const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
require("dotenv").config();

const OWNER_ID = process.env.OWNER_ID;

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

client.commands = new Collection();

/* =========================
   DATABASE CORE
========================= */

const DB_PATH = "./database.json";

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: {},
      teams: {},
      wars: {},
      marriages: {},
      economy: {},
      inventory: {},
      shop: {},
      events: {},
      echo: { authorized: [], logs: [] },
      logs: {},
      seasons: { current: 1 }
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = loadDB();

/* =========================
   USER SYSTEM
========================= */

function getUser(id) {
  if (!db.users[id]) {
    db.users[id] = {
      xp: 0,
      level: 1,
      prestige: 0,
      coins: 0,
      bank: 0,
      reputation: 0,
      messages: 0,
      voice: 0,
      team: null,
      marriage: null,
      createdAt: Date.now()
    };
  }
  return db.users[id];
}

function addCoins(id, amount) {
  const u = getUser(id);
  u.coins += amount;
}

function addXP(id, amount) {
  const u = getUser(id);

  u.xp += amount;

  let needed = u.level * 120;

  if (u.xp >= needed) {
    u.level++;
    u.xp = 0;

    u.coins += 1000;

    if (u.level % 10 === 0) {
      u.reputation += 2;
    }
  }
}

/* =========================
   ACTIVITY SYSTEM
========================= */

function isValidMessage(content) {
  if (!content) return false;
  if (content.length < 2) return false;
  if (/(\W)\1{5,}/g.test(content)) return false;
  return true;
}

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  user.messages++;

  if (isValidMessage(message.content)) {
    addXP(message.author.id, 10);
    addCoins(message.author.id, 5);
  }

  saveDB(db);
});

/* =========================
   READY
========================= */

client.once("ready", () => {
  console.log(`🤖 Homelander online as ${client.user.tag}`);
});

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

/* ========================= */

client.login(process.env.TOKEN);

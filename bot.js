require("dotenv").config();

const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction
  ]
});

let db = {};

try {
  db = JSON.parse(fs.readFileSync("./database.json", "utf8"));
} catch {
  db = {};
}

function saveDB() {
  fs.writeFileSync("./database.json", JSON.stringify(db, null, 2));
}

function ensureDatabase() {
  db.users ??= {};
  db.teams ??= {};
  db.wars ??= {};
  db.marriages ??= {};
  db.economy ??= {};
  db.inventory ??= {};
  db.shop ??= {};
  db.events ??= {};

  db.echo ??= {
    authorized: [],
    logs: []
  };

  db.logs ??= {
    moderation: [],
    economy: [],
    wars: [],
    social: [],
    owner: [],
    echo: []
  };

  db.seasons ??= {
    current: 1,
    started: Date.now()
  };

  saveDB();
}

function getUser(id) {
  if (!db.users[id]) {
    db.users[id] = {
      id,
      coins: 0,
      bank: 0,
      xp: 0,
      level: 1,
      prestige: 0,
      reputation: 0,
      messages: 0,
      voice: 0,
      team: null,
      marriage: null,
      wins: 0,
      losses: 0,
      warsWon: 0,
      warsLost: 0,
      badges: [],
      achievements: [],
      inventory: [],
      profilePrivate: false,
      joined: Date.now(),
      lastRep: 0,
      lastDaily: 0,
      mission: null
    };

    saveDB();
  }

  return db.users[id];
}

function getTeam(id) {
  if (!db.teams[id]) {
    db.teams[id] = {
      id,
      name: "",
      leader: null,
      coleaders: [],
      members: [],
      maxMembers: 7,
      trophies: 0,
      points: 0,
      alliances: [],
      rivals: [],
      wins: 0,
      losses: 0,
      history: [],
      created: Date.now()
    };

    saveDB();
  }

  return db.teams[id];
}

function getMarriage(id) {
  if (!db.marriages[id]) {
    db.marriages[id] = {
      id,
      users: [],
      created: Date.now(),
      sharedCoins: 0,
      sharedBank: 0,
      sharedInventory: []
    };

    saveDB();
  }

  return db.marriages[id];
}

function addLog(type, data) {
  if (!db.logs[type]) db.logs[type] = [];

  db.logs[type].push({
    date: Date.now(),
    ...data
  });

  if (db.logs[type].length > 5000) {
    db.logs[type].shift();
  }

  saveDB();
}

function getGlobalStats() {
  const users = Object.values(db.users);

  return {
    users: users.length,
    coins: users.reduce((a, b) => a + (b.coins || 0), 0),
    xp: users.reduce((a, b) => a + (b.xp || 0), 0),
    messages: users.reduce((a, b) => a + (b.messages || 0), 0),
    voice: users.reduce((a, b) => a + (b.voice || 0), 0)
  };
}

ensureDatabase();

[
  "./bot2",
  "./bot3",
  "./bot4",
  "./bot5",
  "./bot6",
  "./bot7",
  "./bot8",
  "./bot9",
  "./bot10"
].forEach(file => {
  try {
    const mod = require(file);

    if (typeof mod === "function") {
      mod(
        client,
        db,
        saveDB,
        getUser,
        getTeam,
        getMarriage,
        addLog,
        getGlobalStats
      );

      console.log(`${file} loaded`);
    }
  } catch (err) {
    console.error(`Error loading ${file}`);
    console.error(err);
  }
});

client.once("clientReady", () => {
  console.log(`Homelander online: ${client.user.tag}`);
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.login(process.env.TOKEN);

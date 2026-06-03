require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require("discord.js");

const fs = require("fs");
const path = require("path");

/* =========================================
   CLIENT
========================================= */

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

/* =========================================
   GLOBALS
========================================= */

const OWNER_ID = process.env.OWNER_ID;
const DB_PATH = path.join(__dirname, "database.json");

client.commands = new Collection();

/* =========================================
   DATABASE LOAD
========================================= */

let db = {};

try {
  db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
} catch (err) {
  console.error("database.json corrupta o inexistente.");
  process.exit(1);
}

/* =========================================
   ENSURE DATABASE STRUCTURE
========================================= */

function ensureDatabase() {
  db.users ??= {};
  db.teams ??= {};
  db.wars ??= {};
  db.marriages ??= {};
  db.economy ??= {};
  db.inventory ??= {};

  db.shop ??= {
    premiumStock: {
      customRole: 2,
      teamRole: 2,
      robux80: 2,
      nitroBasic: 2,
      nitro: 2,
      deco: 2
    }
  };

  db.events ??= {};

  db.echo ??= {
    authorized: [],
    cooldowns: {},
    logs: []
  };

  db.logs ??= {
    moderation: [],
    economy: [],
    wars: [],
    social: [],
    owner: [],
    echo: [],
    events: []
  };

  db.seasons ??= {
    current: 1,
    startedAt: Date.now()
  };
}

ensureDatabase();

/* =========================================
   SAVE DB
========================================= */

function saveDB() {
  try {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(db, null, 2)
    );
  } catch (err) {
    console.error("Error guardando DB:", err);
  }
}

/* =========================================
   USER INITIALIZER
========================================= */

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

      wins: 0,
      losses: 0,

      duels: 0,
      duelWins: 0,

      warWins: 0,
      warLosses: 0,

      team: null,
      marriage: null,

      inventory: [],

      achievements: [],
      badges: [],

      profilePrivate: false,

      joinedAt: Date.now(),
      lastMessage: 0,
      lastVoice: 0,

      stats: {
        coinsEarned: 0,
        coinsSpent: 0,
        messagesSent: 0,
        voiceMinutes: 0
      },

      mission: null
    };
  }

  return db.users[id];
}

/* =========================================
   LOG SYSTEM
========================================= */

function addLog(category, data) {
  if (!db.logs[category]) {
    db.logs[category] = [];
  }

  db.logs[category].push({
    ...data,
    timestamp: Date.now()
  });

  if (db.logs[category].length > 5000) {
    db.logs[category].shift();
  }

  saveDB();
}

/* =========================================
   HELPERS
========================================= */

function isOwner(id) {
  return id === OWNER_ID;
}

function getSeason() {
  return db.seasons.current;
}

function getActiveEvent() {
  return db.events.active || null;
}

/* =========================================
   EXPORTS FOR MODULES
========================================= */

const core = {
  client,
  db,
  saveDB,
  getUser,
  addLog,
  isOwner,
  getSeason,
  getActiveEvent
};

/* =========================================
   MODULE LOADER
========================================= */

const modules = [
  "./bot2",
  "./bot3",
  "./bot4",
  "./bot5",
  "./bot6"
];

for (const file of modules) {
  try {
    const mod = require(file);

    if (typeof mod === "function") {
      mod(core);
      console.log(`✓ Loaded ${file}`);
    } else {
      console.log(`✗ ${file} no exporta una función`);
    }
  } catch (err) {
    console.error(`✗ Error cargando ${file}`);
    console.error(err);
  }
}

/* =========================================
   READY
========================================= */

client.once("clientReady", async () => {
  console.log("================================");
  console.log("HOMELANDER ONLINE");
  console.log(`Bot: ${client.user.tag}`);
  console.log(`Season: ${db.seasons.current}`);
  console.log("================================");
});

/* =========================================
   AUTO SAVE
========================================= */

setInterval(() => {
  saveDB();
}, 60000);

/* =========================================
   CRASH PROTECTION
========================================= */

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION");
  console.error(err);
});

/* =========================================
   LOGIN
========================================= */

client.login(process.env.TOKEN);

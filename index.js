const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const Database = require("better-sqlite3");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ==========================
// DATABASE (nivel dios)
// ==========================
const db = new Database("altgod.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  created_at INTEGER,
  last_seen INTEGER,
  risk REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  content TEXT,
  timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS edges (
  a TEXT,
  b TEXT,
  weight REAL
);
`);

// ==========================
// CLIENT
// ==========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==========================
// MEMORY CACHE (performance)
// ==========================
const cache = new Map();

// ==========================
// MESSAGE PIPELINE (huella)
// ==========================
client.on("messageCreate", msg => {
  if (msg.author.bot) return;

  db.prepare(`
    INSERT INTO messages (user_id, content, timestamp)
    VALUES (?, ?, ?)
  `).run(msg.author.id, msg.content, Date.now());

  cache.set(msg.author.id, (cache.get(msg.author.id) || []).concat(msg.content).slice(-50));
});

// ==========================
// USER UPSERT
// ==========================
function upsertUser(user) {
  const exists = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id);

  if (!exists) {
    db.prepare(`
      INSERT INTO users (id, username, created_at, last_seen)
      VALUES (?, ?, ?, ?)
    `).run(user.id, user.username, Date.now(), Date.now());
  } else {
    db.prepare(`
      UPDATE users SET username = ?, last_seen = ?
      WHERE id = ?
    `).run(user.username, Date.now(), user.id);
  }
}

// ==========================
// TEXT SIGNATURE (nivel dios)
// ==========================
function getSignature(texts) {
  const text = texts.join(" ").toLowerCase();

  const words = text
    .replace(/[^a-z0-9áéíóúñ ]/gi, "")
    .split(/\s+/)
    .filter(w => w.length > 3);

  const freq = {};

  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(x => x[0]);
}

// ==========================
// SIMILARITY ENGINE (core dios)
// ==========================
function similarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);

  const intersection = [...setA].filter(x => setB.has(x));

  const union = new Set([...setA, ...setB]);

  return intersection.length / union.size;
}

// ==========================
// RISK ENGINE (no lineal, nivel dios)
// ==========================
function calculateRisk({ user, messagesA, messagesB, usernameMatch, timeCluster }) {
  let score = 0;
  const reasons = [];

  const ageDays = (Date.now() - user.createdTimestamp) / 86400000;

  const ageFactor = ageDays < 7 ? 0.4 : ageDays < 30 ? 0.2 : 0;

  score += ageFactor * 100;
  if (ageFactor > 0) reasons.push("cuenta reciente");

  if (usernameMatch) {
    score += 25;
    reasons.push("similitud de username");
  }

  const sigA = getSignature(messagesA);
  const sigB = getSignature(messagesB);

  const sim = similarity(sigA, sigB);

  score += sim * 50;
  if (sim > 0.3) reasons.push("huella de escritura similar");

  if (timeCluster) {
    score += 20;
    reasons.push("actividad sincronizada");
  }

  score = Math.min(100, Math.round(score));

  let level = "bajo";
  if (score >= 70) level = "alto";
  else if (score >= 40) level = "medio";

  return { score, level, reasons };
}

// ==========================
// GRAPH SYSTEM (alt network)
// ==========================
function linkUsers(a, b, weight) {
  db.prepare(`
    INSERT INTO edges (a, b, weight)
    VALUES (?, ?, ?)
  `).run(a, b, weight);
}

// ==========================
// EMBED (siempre color = línea lateral)
// ==========================
function buildEmbed(user, result) {
  return new EmbedBuilder()
    .setTitle("analisis de identidad")
    .setColor(
      result.level === "alto"
        ? 0xe74c3c
        : result.level === "medio"
        ? 0xf1c40f
        : 0x2ecc71
    )
    .addFields(
      { name: "usuario", value: user.tag, inline: true },
      { name: "riesgo", value: `${result.score}%`, inline: true },
      { name: "nivel", value: result.level, inline: true },
      {
        name: "razones",
        value: result.reasons.length ? result.reasons.join("\n") : "sin señales"
      }
    )
    .setTimestamp();
}

// ==========================
// COMMANDS (solo 2)
// ==========================
const commands = [
  new SlashCommandBuilder()
    .setName("alt")
    .setDescription("analiza posible alt")
    .addUserOption(o =>
      o.setName("usuario").setDescription("usuario").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("compare")
    .setDescription("compara dos usuarios")
    .addUserOption(o =>
      o.setName("usuario1").setDescription("usuario 1").setRequired(true)
    )
    .addUserOption(o =>
      o.setName("usuario2").setDescription("usuario 2").setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: commands
  });
})();

// ==========================
// READY
// ==========================
client.once("ready", () => {
  console.log("alt detector god mode online");
});

// ==========================
// ALT ANALYSIS (CORE)
// ==========================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ================= ALT =================
  if (interaction.commandName === "alt") {
    const user = interaction.options.getUser("usuario");
    const member = await interaction.guild.members.fetch(user.id);

    upsertUser(user);

    const messages = db.prepare(
      `SELECT content FROM messages WHERE user_id = ? LIMIT 200`
    ).all(user.id).map(m => m.content);

    const other = interaction.guild.members.cache.find(
      m => m.user.id !== user.id &&
      m.user.username.substring(0,4).toLowerCase() === user.username.substring(0,4).toLowerCase()
    );

    const otherMessages = other
      ? db.prepare(`SELECT content FROM messages WHERE user_id = ? LIMIT 200`).all(other.user.id).map(m => m.content)
      : [];

    const usernameMatch = !!other;

    const timeCluster = [...interaction.guild.members.cache.values()]
      .filter(m => Math.abs(m.joinedTimestamp - member.joinedTimestamp) < 300000).length > 3;

    const result = calculateRisk({
      user,
      messagesA: messages,
      messagesB: otherMessages,
      usernameMatch,
      timeCluster
    });

    if (other) {
      linkUsers(user.id, other.user.id, result.score);
    }

    return interaction.reply({
      embeds: [buildEmbed(user, result)]
    });
  }

  // ================= COMPARE =================
  if (interaction.commandName === "compare") {
    const u1 = interaction.options.getUser("usuario1");
    const u2 = interaction.options.getUser("usuario2");

    const m1 = db.prepare(`SELECT content FROM messages WHERE user_id = ?`).all(u1.id).map(m => m.content);
    const m2 = db.prepare(`SELECT content FROM messages WHERE user_id = ?`).all(u2.id).map(m => m.content);

    const sig1 = getSignature(m1);
    const sig2 = getSignature(m2);

    const sim = similarity(sig1, sig2) * 100;

    const level = sim > 70 ? "alto" : sim > 40 ? "medio" : "bajo";

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("comparacion de identidad")
          .setColor(level === "alto" ? 0xe74c3c : level === "medio" ? 0xf1c40f : 0x2ecc71)
          .addFields(
            { name: "usuario 1", value: u1.tag, inline: true },
            { name: "usuario 2", value: u2.tag, inline: true },
            { name: "similitud", value: `${sim.toFixed(1)}%` },
            { name: "nivel", value: level }
          )
          .setTimestamp()
      ]
    });
  }
});

client.login(TOKEN);

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const express = require("express");
const Database = require("better-sqlite3");

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ================= DB =================
const db = new Database("db.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  score INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  content TEXT
);

CREATE TABLE IF NOT EXISTS edges (
  user1 TEXT,
  user2 TEXT,
  weight INTEGER,
  type TEXT
);
`);

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= EXPRESS (GRAFO API) =================
const app = express();

app.get("/", (req, res) => {
  res.send("bot online");
});

app.get("/graph", (req, res) => {
  const edges = db.prepare("SELECT * FROM edges").all();
  res.json(edges);
});

app.listen(3000, () => {
  console.log("dashboard online");
});

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("alt")
    .setDescription("analiza usuario")
    .addUserOption(o =>
      o.setName("usuario").setDescription("usuario").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("compare")
    .setDescription("compara usuarios")
    .addUserOption(o =>
      o.setName("u1").setDescription("usuario 1").setRequired(true)
    )
    .addUserOption(o =>
      o.setName("u2").setDescription("usuario 2").setRequired(true)
    )
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
  console.log("bot online:", client.user.tag);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("commands ready");
});

// ================= MESSAGE TRACKING =================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  db.prepare(`
    INSERT INTO messages (userId, content)
    VALUES (?, ?)
  `).run(msg.author.id, msg.content);
});

// ================= ANALYSIS ENGINE (PRO) =================
function analyzeUser(user, messages) {
  let score = 0;
  let reasons = [];

  const msgCount = messages.length;

  const avgLength =
    msgCount > 0
      ? messages.reduce((a, m) => a + m.content.length, 0) / msgCount
      : 0;

  const words = messages
    .map(m => m.content.toLowerCase().split(/\s+/))
    .flat();

  const uniqueWords = new Set(words).size;

  // edad cuenta
  const ageDays = user.createdTimestamp
    ? (Date.now() - user.createdTimestamp) / 86400000
    : 0;

  if (ageDays < 7) {
    score += 40;
    reasons.push("Cuenta muy reciente.");
  }

  // actividad
  if (msgCount > 120) {
    score += 15;
    reasons.push("Actividad alta de mensajes.");
  }

  // escritura simple
  if (avgLength < 10) {
    score += 10;
    reasons.push("Mensajes muy cortos.");
  }

  // repetición baja (posible bot/alt)
  if (uniqueWords / (words.length || 1) < 0.4) {
    score += 15;
    reasons.push("Baja variedad de palabras.");
  }

  // username
  if (user.username.length < 4) {
    score += 20;
    reasons.push("Username sospechoso.");
  }

  let level = "Bajo";
  if (score >= 70) level = "Alto";
  else if (score >= 40) level = "Medio";

  return { score, level, reasons, msgCount };
}

// ================= GRAPH LINKING =================
function linkUsers(u1, u2, weight, type) {
  db.prepare(`
    INSERT INTO edges (user1, user2, weight, type)
    VALUES (?, ?, ?, ?)
  `).run(u1, u2, weight, type);
}

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  try {

    // ================= ALT =================
    if (i.commandName === "alt") {
      const user = i.options.getUser("usuario");

      await i.deferReply();

      const messages = db.prepare(
        "SELECT * FROM messages WHERE userId = ?"
      ).all(user.id);

      const result = analyzeUser(user, messages);

      db.prepare(`
        INSERT OR REPLACE INTO users (id, username, score)
        VALUES (?, ?, ?)
      `).run(user.id, user.username, result.score);

      const embed = new EmbedBuilder()
        .setTitle("Análisis avanzado de usuario")
        .setDescription("Sistema de detección de alts.")
        .addFields(
          { name: "Usuario", value: user.tag },
          { name: "Score", value: `${result.score}/100` },
          { name: "Nivel", value: result.level },
          { name: "Mensajes analizados", value: `${result.msgCount}` },
          { name: "Razones", value: result.reasons.join("\n") || "Ninguna." }
        );

      return i.editReply({ embeds: [embed] });
    }

    // ================= COMPARE =================
    if (i.commandName === "compare") {
      const u1 = i.options.getUser("u1");
      const u2 = i.options.getUser("u2");

      await i.deferReply();

      let similarity = 0;

      if (u1.username.slice(0, 4) === u2.username.slice(0, 4)) {
        similarity += 30;
        linkUsers(u1.id, u2.id, 30, "username");
      }

      const embed = new EmbedBuilder()
        .setTitle("Comparación de usuarios")
        .addFields(
          { name: "Usuario 1", value: u1.tag },
          { name: "Usuario 2", value: u2.tag },
          { name: "Similitud", value: `${similarity}%` }
        );

      return i.editReply({ embeds: [embed] });
    }

  } catch (err) {
    console.error(err);
    if (i.deferred) return i.editReply("Error interno.");
    return i.reply("Error interno.");
  }
});

// ================= LOGIN =================
client.login(TOKEN);

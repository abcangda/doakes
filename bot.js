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

CREATE TABLE IF NOT EXISTS relations (
  user1 TEXT,
  user2 TEXT,
  score INTEGER
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

// ================= EXPRESS DASHBOARD =================
const app = express();

app.get("/graph", (req, res) => {
  const edges = db.prepare("SELECT * FROM relations").all();
  res.json(edges);
});

app.listen(3000, () => {
  console.log("DASHBOARD ONLINE.");
});

// ================= COMMANDS =================
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
      o.setName("u1").setDescription("usuario 1").setRequired(true)
    )
    .addUserOption(o =>
      o.setName("u2").setDescription("usuario 2").setRequired(true)
    )
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
  console.log(`BOT ONLINE COMO: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("COMANDOS REGISTRADOS.");
});

// ================= MESSAGE LOG =================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  db.prepare(`
    INSERT INTO messages (userId, content)
    VALUES (?, ?)
  `).run(msg.author.id, msg.content);
});

// ================= ANALISIS =================
function analyze(user, messages) {
  let score = 0;
  let reasons = [];

  const msgCount = messages.length;

  if (msgCount > 100) {
    score += 20;
    reasons.push("ALTA ACTIVIDAD DE MENSAJES.");
  }

  if (user.username.length < 4) {
    score += 25;
    reasons.push("USERNAME MUY CORTO O SOSPECHOSO.");
  }

  if (user.createdTimestamp && Date.now() - user.createdTimestamp < 7 * 86400000) {
    score += 40;
    reasons.push("CUENTA MUY RECIENTE.");
  }

  let level = "BAJO";
  if (score >= 70) level = "ALTO";
  else if (score >= 40) level = "MEDIO";

  return { score, reasons, level };
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

      const result = analyze(user, messages);

      db.prepare(`
        INSERT OR REPLACE INTO users (id, username, score)
        VALUES (?, ?, ?)
      `).run(user.id, user.username, result.score);

      const embed = new EmbedBuilder()
        .setTitle("ANÁLISIS DE USUARIO")
        .setDescription("REPORTE DE RIESGO.")
        .addFields(
          { name: "USUARIO", value: user.tag },
          { name: "SCORE", value: `${result.score}/100` },
          { name: "NIVEL", value: result.level },
          { name: "RAZONES", value: result.reasons.join("\n") || "NINGUNA." }
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
      }

      db.prepare(`
        INSERT INTO relations (user1, user2, score)
        VALUES (?, ?, ?)
      `).run(u1.id, u2.id, similarity);

      const embed = new EmbedBuilder()
        .setTitle("COMPARACIÓN DE USUARIOS")
        .addFields(
          { name: "USUARIO 1", value: u1.tag },
          { name: "USUARIO 2", value: u2.tag },
          { name: "SIMILITUD", value: `${similarity}%` }
        );

      return i.editReply({ embeds: [embed] });
    }

  } catch (err) {
    console.error(err);
    if (i.deferred) return i.editReply("ERROR INTERNO.");
    return i.reply("ERROR INTERNO.");
  }
});

// ================= LOGIN =================
client.login(TOKEN);

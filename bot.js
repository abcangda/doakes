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

// ======================
// DEBUG ANTI-CRASH
// ======================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ======================
// DB
// ======================
const db = new Database("db.db");

db.exec(`
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

// ======================
// CLIENT
// ======================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ======================
// SAVE MESSAGES
// ======================
client.on("messageCreate", msg => {
  if (msg.author.bot) return;

  db.prepare(`
    INSERT INTO messages (user_id, content, timestamp)
    VALUES (?, ?, ?)
  `).run(msg.author.id, msg.content || "", Date.now());
});

// ======================
// GET MESSAGES
// ======================
function getMessages(id) {
  return db.prepare(`
    SELECT content FROM messages
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT 120
  `).all(id).map(m => m.content || "");
}

// ======================
// SIGNATURE
// ======================
function signature(msgs) {
  const text = msgs.join(" ").toLowerCase();

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
    .slice(0, 10)
    .map(x => x[0]);
}

// ======================
// SIMILARITY SAFE
// ======================
function sim(a, b) {
  const A = new Set(a || []);
  const B = new Set(b || []);

  const inter = [...A].filter(x => B.has(x));
  const union = new Set([...A, ...B]);

  return union.size ? inter.length / union.size : 0;
}

// ======================
// SCORE ENGINE
// ======================
function score(user, other, msgsA, msgsB) {
  let s = 0;
  const reasons = [];

  const age = (Date.now() - user.createdTimestamp) / 86400000;

  if (age < 7) {
    s += 40;
    reasons.push("cuenta muy nueva");
  } else if (age < 30) {
    s += 20;
    reasons.push("cuenta reciente");
  }

  const sigA = signature(msgsA);
  const sigB = signature(msgsB);

  const similarity = sim(sigA, sigB);

  s += similarity * 60;

  if (similarity > 0.3) {
    reasons.push("patrón de escritura similar");
  }

  const nameMatch =
    user.username?.substring(0, 4).toLowerCase() ===
    other.username?.substring(0, 4).toLowerCase();

  if (nameMatch) {
    s += 20;
    reasons.push("username similar");
  }

  s = Math.min(100, Math.round(s));

  let level = "bajo";
  if (s >= 70) level = "alto";
  else if (s >= 40) level = "medio";

  return { s, level, reasons };
}

// ======================
// SAFE EMBED BUILDER (ANTI ERROR)
// ======================
function buildEmbed(user, result, a, b) {
  const reasonsText =
    Array.isArray(result.reasons) && result.reasons.length
      ? result.reasons.join("\n")
      : "sin señales";

  return new EmbedBuilder()
    .setTitle("analisis de alt")
    .setColor(
      result.level === "alto"
        ? 0xe74c3c
        : result.level === "medio"
        ? 0xf1c40f
        : 0x2ecc71
    )
    .addFields(
      { name: "usuario", value: String(user.tag || "desconocido"), inline: true },
      { name: "riesgo", value: `${Number(result.s || 0)}%`, inline: true },
      { name: "nivel", value: String(result.level || "bajo"), inline: true },
      { name: "mensajes analizados", value: `${a} vs ${b}` },
      { name: "razones", value: reasonsText }
    )
    .setTimestamp();
}

// ======================
// COMMANDS
// ======================
const commands = [
  new SlashCommandBuilder()
    .setName("alt")
    .setDescription("analiza usuario")
    .addUserOption(o => o.setName("usuario").setRequired(true)),

  new SlashCommandBuilder()
    .setName("compare")
    .setDescription("compara usuarios")
    .addUserOption(o => o.setName("u1").setRequired(true))
    .addUserOption(o => o.setName("u2").setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
})();

// ======================
// READY
// ======================
client.once("ready", () => {
  console.log("bot online");
});

// ======================
// COMMAND HANDLER
// ======================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  // ALT
  if (i.commandName === "alt") {
    const u = i.options.getUser("usuario");

    const msgsA = getMessages(u.id);

    const other = i.guild.members.cache.find(m =>
      m.user.id !== u.id &&
      m.user.username?.substring(0, 4).toLowerCase() ===
      u.username?.substring(0, 4).toLowerCase()
    );

    const msgsB = other ? getMessages(other.user.id) : [];

    const res = score(u, other || u, msgsA, msgsB);

    return i.reply({
      embeds: [buildEmbed(u, res, msgsA.length, msgsB.length)]
    });
  }

  // COMPARE
  if (i.commandName === "compare") {
    const u1 = i.options.getUser("u1");
    const u2 = i.options.getUser("u2");

    const m1 = getMessages(u1.id);
    const m2 = getMessages(u2.id);

    const s1 = signature(m1);
    const s2 = signature(m2);

    const simi = sim(s1, s2) * 100;

    return i.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("comparacion")
          .setColor(simi > 70 ? 0xe74c3c : simi > 40 ? 0xf1c40f : 0x2ecc71)
          .addFields(
            { name: "u1", value: u1.tag, inline: true },
            { name: "u2", value: u2.tag, inline: true },
            { name: "similitud", value: `${simi.toFixed(1)}%` }
          )
      ]
    });
  }
});

client.login(TOKEN);

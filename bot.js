const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const express = require("express");
const Database = require("better-sqlite3");

// ==================================================
// CONFIG
// ==================================================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ==================================================
// DATABASE
// ==================================================

const db = new Database("db.db");

db.exec(`

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  score INTEGER DEFAULT 0,
  lastAnalysis INTEGER
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  content TEXT,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS edges (
  user1 TEXT,
  user2 TEXT,
  weight INTEGER,
  type TEXT,
  createdAt INTEGER
);

`);

// ==================================================
// CLIENT
// ==================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==================================================
// EXPRESS DASHBOARD
// ==================================================

const app = express();

app.get("/", (req, res) => {
  res.send("Alt Intelligence System Online.");
});

app.get("/graph", (req, res) => {

  const edges = db.prepare(`
    SELECT *
    FROM edges
    ORDER BY weight DESC
  `).all();

  res.json(edges);
});

app.listen(3000, () => {
  console.log("Dashboard online.");
});

// ==================================================
// COMMANDS
// ==================================================

const commands = [

  new SlashCommandBuilder()

    .setName("alt")
    .setDescription("Analiza un usuario")

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()

    .setName("compare")
    .setDescription("Compara dos usuarios")

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option
        .setName("u1")
        .setDescription("Usuario 1")
        .setRequired(true)
    )

    .addUserOption(option =>
      option
        .setName("u2")
        .setDescription("Usuario 2")
        .setRequired(true)
    ),

  new SlashCommandBuilder()

    .setName("profile")
    .setDescription(
      "Muestra el perfil avanzado de un usuario"
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

// ==================================================
// REGISTER COMMANDS
// ==================================================

async function registerCommands() {

  const rest = new REST({
    version: "10"
  }).setToken(TOKEN);

  // ELIMINA COMANDOS GLOBALES VIEJOS

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    {
      body: []
    }
  );

  // REGISTRA SOLO LOS NUEVOS

  await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      GUILD_ID
    ),
    {
      body: commands
    }
  );

  console.log(
    "Slash commands sincronizados."
  );
}

// ==================================================
// READY
// ==================================================

client.once(
  "clientReady",
  async () => {

    console.log(
      `Bot online como ${client.user.tag}`
    );

    await registerCommands();
  }
);

// ==================================================
// MESSAGE LOGGER
// ==================================================

client.on(
  "messageCreate",
  message => {

    if (message.author.bot)
      return;

    db.prepare(`
      INSERT INTO messages (
        userId,
        content,
        createdAt
      )
      VALUES (?, ?, ?)
    `).run(
      message.author.id,
      message.content,
      Date.now()
    );
  }
);

// ==================================================
// ANALYSIS ENGINE
// ==================================================

function analyzeUser(
  user,
  messages
) {

  let score = 0;

  let reasons = [];

  const totalMessages =
    messages.length;

  // ==================================================
  // ACCOUNT AGE
  // ==================================================

  const ageDays =
    (
      Date.now()
      - user.createdTimestamp
    ) / 86400000;

  if (ageDays < 7) {

    score += 40;

    reasons.push(
      "La cuenta fue creada recientemente."
    );
  }

  else if (ageDays < 30) {

    score += 20;

    reasons.push(
      "La cuenta es relativamente nueva."
    );
  }

  // ==================================================
  // MESSAGE ACTIVITY
  // ==================================================

  if (totalMessages > 150) {

    score += 15;

    reasons.push(
      "Actividad elevada de mensajes."
    );
  }

  // ==================================================
  // AVERAGE LENGTH
  // ==================================================

  const avgLength =
    totalMessages > 0
      ? messages.reduce(
          (a, m) =>
            a + m.content.length,
          0
        ) / totalMessages
      : 0;

  if (avgLength < 10) {

    score += 10;

    reasons.push(
      "Mensajes extremadamente cortos."
    );
  }

  // ==================================================
  // WORD ANALYSIS
  // ==================================================

  const words =
    messages.flatMap(m =>
      m.content
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    );

  const uniqueWords =
    new Set(words).size;

  const lexical =
    uniqueWords /
    (words.length || 1);

  if (lexical < 0.40) {

    score += 15;

    reasons.push(
      "Patrón repetitivo de lenguaje."
    );
  }

  // ==================================================
  // USERNAME
  // ==================================================

  if (
    user.username.length < 4
  ) {

    score += 15;

    reasons.push(
      "Username sospechoso."
    );
  }

  // ==================================================
  // LIMIT
  // ==================================================

  if (score > 100)
    score = 100;

  // ==================================================
  // LEVEL
  // ==================================================

  let level = "Bajo";

  if (score >= 70)
    level = "Alto";

  else if (score >= 40)
    level = "Medio";

  return {
    score,
    level,
    reasons,
    totalMessages,
    avgLength,
    lexical
  };
}

// ==================================================
// CONNECTION SYSTEM
// ==================================================

function addConnection(
  user1,
  user2,
  weight,
  type
) {

  db.prepare(`
    INSERT INTO edges (
      user1,
      user2,
      weight,
      type,
      createdAt
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    user1,
    user2,
    weight,
    type,
    Date.now()
  );
}

// ==================================================
// INTERACTIONS
// ==================================================

client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isChatInputCommand()
    ) return;

    try {

      // ==================================================
      // /ALT
      // ==================================================

      if (
        interaction.commandName ===
        "alt"
      ) {

        const user =
          interaction.options.getUser(
            "usuario"
          );

        await interaction.deferReply();

        const messages =
          db.prepare(`
            SELECT *
            FROM messages
            WHERE userId = ?
          `).all(user.id);

        const analysis =
          analyzeUser(
            user,
            messages
          );

        db.prepare(`
          INSERT OR REPLACE INTO users (
            id,
            username,
            score,
            lastAnalysis
          )
          VALUES (?, ?, ?, ?)
        `).run(
          user.id,
          user.username,
          analysis.score,
          Date.now()
        );

        let color = 0x57F287;

        if (
          analysis.score >= 70
        ) {

          color = 0xED4245;
        }

        else if (
          analysis.score >= 40
        ) {

          color = 0xFEE75C;
        }

        const embed =
          new EmbedBuilder()

            .setTitle(
              "Análisis de usuario"
            )

            .setDescription(
              "Reporte avanzado del sistema."
            )

            .setThumbnail(
              user.displayAvatarURL()
            )

            .setColor(color)

            .addFields(

              {
                name: "Usuario",
                value: user.tag,
                inline: true
              },

              {
                name: "Score",
                value:
                  `${analysis.score}/100`,
                inline: true
              },

              {
                name:
                  "Nivel de riesgo",
                value:
                  analysis.level,
                inline: true
              },

              {
                name:
                  "Mensajes analizados",
                value:
                  `${analysis.totalMessages}`,
                inline: true
              },

              {
                name:
                  "Razones",
                value:
                  analysis.reasons.join(
                    "\n"
                  ) ||
                  "No se detectaron señales relevantes."
              }

            );

        return interaction.editReply({
          embeds: [embed]
        });
      }

      // ==================================================
      // /COMPARE
      // ==================================================

      if (
        interaction.commandName ===
        "compare"
      ) {

        const u1 =
          interaction.options.getUser(
            "u1"
          );

        const u2 =
          interaction.options.getUser(
            "u2"
          );

        await interaction.deferReply();

        let similarity = 0;

        let reasons = [];

        // USERNAME

        if (
          u1.username
            .slice(0, 4)
            .toLowerCase()
          ===
          u2.username
            .slice(0, 4)
            .toLowerCase()
        ) {

          similarity += 30;

          reasons.push(
            "Coincidencia parcial de username."
          );

          addConnection(
            u1.id,
            u2.id,
            30,
            "username_similarity"
          );
        }

        // MESSAGE STYLE

        const m1 =
          db.prepare(`
            SELECT *
            FROM messages
            WHERE userId = ?
          `).all(u1.id);

        const m2 =
          db.prepare(`
            SELECT *
            FROM messages
            WHERE userId = ?
          `).all(u2.id);

        const avg1 =
          m1.length
            ? m1.reduce(
                (a, m) =>
                  a +
                  m.content.length,
                0
              ) / m1.length
            : 0;

        const avg2 =
          m2.length
            ? m2.reduce(
                (a, m) =>
                  a +
                  m.content.length,
                0
              ) / m2.length
            : 0;

        if (
          Math.abs(
            avg1 - avg2
          ) < 6
        ) {

          similarity += 20;

          reasons.push(
            "Patrones de escritura similares."
          );

          addConnection(
            u1.id,
            u2.id,
            20,
            "writing_pattern"
          );
        }

        // LIMIT

        if (similarity > 100)
          similarity = 100;

        // LEVEL

        let level = "Bajo";

        if (similarity >= 70)
          level = "Alto";

        else if (similarity >= 40)
          level = "Medio";

        let color = 0x57F287;

        if (
          similarity >= 70
        ) {

          color = 0xED4245;
        }

        else if (
          similarity >= 40
        ) {

          color = 0xFEE75C;
        }

        const embed =
          new EmbedBuilder()

            .setTitle(
              "Comparación de usuarios"
            )

            .setDescription(
              "Análisis avanzado de similitud."
            )

            .setColor(color)

            .addFields(

              {
                name:
                  "Usuario 1",
                value: u1.tag,
                inline: true
              },

              {
                name:
                  "Usuario 2",
                value: u2.tag,
                inline: true
              },

              {
                name:
                  "Similitud",
                value:
                  `${similarity}%`,
                inline: true
              },

              {
                name:
                  "Nivel",
                value: level,
                inline: true
              },

              {
                name:
                  "Razones",
                value:
                  reasons.join(
                    "\n"
                  ) ||
                  "No se detectaron coincidencias relevantes."
              }

            );

        return interaction.editReply({
          embeds: [embed]
        });
      }

      // ==================================================
      // /PROFILE
      // ==================================================

      if (
        interaction.commandName ===
        "profile"
      ) {

        const user =
          interaction.options.getUser(
            "usuario"
          );

        await interaction.deferReply();

        const messages =
          db.prepare(`
            SELECT *
            FROM messages
            WHERE userId = ?
          `).all(user.id);

        const analysis =
          analyzeUser(
            user,
            messages
          );

        // ==================================================
        // WORDS
        // ==================================================

        const words =
          messages.flatMap(m =>
            m.content
              .toLowerCase()
              .split(/\s+/)
              .filter(Boolean)
          );

        // ==================================================
        // MOST USED WORD
        // ==================================================

        const freq = {};

        for (const word of words) {

          if (word.length < 3)
            continue;

          freq[word] =
            (freq[word] || 0) + 1;
        }

        let topWord =
          "No disponible";

        let topCount = 0;

        for (const word in freq) {

          if (
            freq[word] >
            topCount
          ) {

            topCount =
              freq[word];

            topWord = word;
          }
        }

        // ==================================================
        // ACTIVE DAY
        // ==================================================

        const dayMap = {
          0: "Domingo",
          1: "Lunes",
          2: "Martes",
          3: "Miércoles",
          4: "Jueves",
          5: "Viernes",
          6: "Sábado"
        };

        const days = {};

        for (const msg of messages) {

          const day =
            new Date(
              msg.createdAt
            ).getDay();

          days[day] =
            (days[day] || 0) + 1;
        }

        let activeDay =
          "No disponible";

        let activeDayCount = 0;

        for (const d in days) {

          if (
            days[d] >
            activeDayCount
          ) {

            activeDayCount =
              days[d];

            activeDay =
              dayMap[d];
          }
        }

        // ==================================================
        // ACTIVE HOUR
        // ==================================================

        const hours = {};

        for (const msg of messages) {

          const hour =
            new Date(
              msg.createdAt
            ).getHours();

          hours[hour] =
            (hours[hour] || 0) + 1;
        }

        let activeHour =
          "No disponible";

        let activeHourCount = 0;

        for (const h in hours) {

          if (
            hours[h] >
            activeHourCount
          ) {

            activeHourCount =
              hours[h];

            activeHour =
              `${h}:00`;
          }
        }

        // ==================================================
        // CONNECTIONS
        // ==================================================

        const connections =
          db.prepare(`
            SELECT *
            FROM edges
            WHERE user1 = ?
            OR user2 = ?
          `).all(
            user.id,
            user.id
          );

        // ==================================================
        // COLORS
        // ==================================================

        let color = 0x57F287;

        if (
          analysis.score >= 70
        ) {

          color = 0xED4245;
        }

        else if (
          analysis.score >= 40
        ) {

          color = 0xFEE75C;
        }

        // ==================================================
        // EMBED
        // ==================================================

        const embed =
          new EmbedBuilder()

            .setTitle(
              "Perfil interno de usuario"
            )

            .setDescription(
              "Reporte avanzado del sistema."
            )

            .setThumbnail(
              user.displayAvatarURL()
            )

            .setColor(color)

            .addFields(

              {
                name: "Usuario",
                value: user.tag,
                inline: true
              },

              {
                name: "ID",
                value: user.id,
                inline: true
              },

              {
                name:
                  "Cuenta creada",
                value:
                  `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`
              },

              {
                name:
                  "Mensajes analizados",
                value:
                  `${analysis.totalMessages}`,
                inline: true
              },

              {
                name:
                  "Promedio de longitud",
                value:
                  `${analysis.avgLength.toFixed(1)} caracteres`,
                inline: true
              },

              {
                name:
                  "Variedad léxica",
                value:
                  `${analysis.lexical.toFixed(2)}`,
                inline: true
              },

              {
                name:
                  "Palabra más usada",
                value:
                  `${topWord} (${topCount})`,
                inline: true
              },

              {
                name:
                  "Día más activo",
                value:
                  activeDay,
                inline: true
              },

              {
                name:
                  "Hora más activa",
                value:
                  activeHour,
                inline: true
              },

              {
                name:
                  "Conexiones detectadas",
                value:
                  `${connections.length}`,
                inline: true
      

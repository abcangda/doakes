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

const transcribe = require("./bot2");
const permission = require("./bot3");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const db = new Database("db.db");

// =========================
// DATABASE
// =========================

db.exec(`

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  content TEXT,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS permissions (
  userId TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS edges (
  user1 TEXT,
  user2 TEXT,
  weight INTEGER,
  type TEXT,
  createdAt INTEGER
);

`);

// =========================
// FUNCTIONS
// =========================

function hasPermission(userId) {

  const row = db.prepare(`
    SELECT userId
    FROM permissions
    WHERE userId = ?
  `).get(userId);

  return row ? true : false;
}

function analyzeUser(user, messages) {

  let score = 0;

  let reasons = [];

  const totalMessages =
    messages.length;

  const ageDays =
    (
      Date.now()
      - user.createdTimestamp
    ) / 86400000;

  if (ageDays < 7) {

    score += 40;

    reasons.push(
      "Cuenta creada recientemente."
    );
  }

  else if (ageDays < 30) {

    score += 20;

    reasons.push(
      "Cuenta relativamente nueva."
    );
  }

  if (totalMessages > 100) {

    score += 20;

    reasons.push(
      "Actividad elevada."
    );
  }

  if (user.username.length < 4) {

    score += 15;

    reasons.push(
      "Username sospechoso."
    );
  }

  if (score > 100)
    score = 100;

  let level = "Bajo";

  if (score >= 70)
    level = "Alto";

  else if (score >= 40)
    level = "Medio";

  return {
    score,
    level,
    reasons,
    totalMessages
  };
}

// =========================
// CLIENT
// =========================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// EXPRESS
// =========================

const app = express();

app.get("/", (req, res) => {

  res.send(
    "Alt Intelligence System Online."
  );
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

  console.log(
    "Dashboard online."
  );
});

// =========================
// COMMANDS
// =========================

const commands = [

  transcribe.command,
  permission.command,

  new SlashCommandBuilder()

    .setName("alt")

    .setDescription(
      "Analiza un usuario"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()

    .setName("compare")

    .setDescription(
      "Compara dos usuarios"
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
      "Muestra el perfil avanzado"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

// =========================
// REGISTER COMMANDS
// =========================

async function registerCommands() {

  const rest = new REST({
    version: "10"
  }).setToken(TOKEN);

  // LIMPIAR GLOBALES

  await rest.put(
    Routes.applicationCommands(
      CLIENT_ID
    ),
    { body: [] }
  );

  // REGISTRAR GUILD

  await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      GUILD_ID
    ),
    { body: commands }
  );

  console.log(
    "Commands synced."
  );
}

// =========================
// READY
// =========================

client.once(
  "clientReady",
  async () => {

    console.log(
      `Bot online como ${client.user.tag}`
    );

    await registerCommands();
  }
);

// =========================
// MESSAGE LOGGING
// =========================

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

// =========================
// INTERACTIONS
// =========================

client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isChatInputCommand()
    ) return;

    try {

      const member =
        interaction.member;

      const isAdmin =
        member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      const permitted =
        hasPermission(
          interaction.user.id
        );

      // =====================
      // ADMIN ONLY
      // =====================

      if (
        interaction.commandName ===
        "permission"
      ) {

        if (!isAdmin) {

          return interaction.reply({
            content:
              "Solo administradores pueden usar este comando.",
            ephemeral: true
          });
        }

        return permission.execute(
          interaction
        );
      }

      // =====================
      // OTHER COMMANDS
      // =====================

      if (
        !isAdmin &&
        !permitted
      ) {

        return interaction.reply({
          content:
            "No tienes permisos para usar el bot.",
          ephemeral: true
        });
      }

      // =====================
      // TRANSCRIBE
      // =====================

      if (
        interaction.commandName ===
        "transcribe"
      ) {

        return transcribe.execute(
          interaction
        );
      }

      // =====================
      // ALT
      // =====================

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

        let color = 0x57F287;

        if (analysis.score >= 70)
          color = 0xED4245;

        else if (
          analysis.score >= 40
        )
          color = 0xFEE75C;

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
                name: "Nivel",
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
                  analysis.reasons.join("\n")
                  || "Sin señales relevantes."
              }

            );

        return interaction.editReply({
          embeds: [embed]
        });
      }

      // =====================
      // COMPARE
      // =====================

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
            u1.id,
            u2.id,
            30,
            "username_similarity",
            Date.now()
          );
        }

        let level = "Bajo";

        if (similarity >= 70)
          level = "Alto";

        else if (
          similarity >= 40
        )
          level = "Medio";

        const embed =
          new EmbedBuilder()

            .setTitle(
              "Comparación"
            )

            .setDescription(
              "Análisis avanzado."
            )

            .setColor(
              0x5865F2
            )

            .addFields(

              {
                name:
                  "Usuario 1",
                value:
                  u1.tag,
                inline: true
              },

              {
                name:
                  "Usuario 2",
                value:
                  u2.tag,
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
                value:
                  level,
                inline: true
              },

              {
                name:
                  "Razones",
                value:
                  reasons.join("\n")
                  || "Sin coincidencias relevantes."
              }

            );

        return interaction.editReply({
          embeds: [embed]
        });
      }

      // =====================
      // PROFILE
      // =====================

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

        const embed =
          new EmbedBuilder()

            .setTitle(
              "Perfil avanzado"
            )

            .setThumbnail(
              user.displayAvatarURL()
            )

            .setColor(
              0x5865F2
            )

            .addFields(

              {
                name:
                  "Usuario",
                value:
                  user.tag,
                inline: true
              },

              {
                name:
                  "ID",
                value:
                  user.id,
                inline: true
              },

              {
                name:
                  "Mensajes",
                value:
                  `${analysis.totalMessages}`,
                inline: true
              },

              {
                name:
                  "Score",
                value:
                  `${analysis.score}/100`,
                inline: true
              },

              {
                name:
                  "Nivel",
                value:
                  analysis.level,
                inline: true
              }

            );

        return interaction.editReply({
          embeds: [embed]
        });
      }

    }

    catch (err) {

      console.error(err);

      if (
        interaction.deferred
      ) {

        return interaction.editReply({
          content:
            "Ocurrió un error."
        });
      }

      return interaction.reply({
        content:
          "Ocurrió un error.",
        ephemeral: true
      });
    }
  }
);

// =========================
// LOGIN
// =========================

client.login(TOKEN);

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const express =
  require("express");

const Database =
  require("better-sqlite3");

const transcribe =
  require("./bot2");

const permission =
  require("./bot3");

const TOKEN =
  process.env.TOKEN;

const CLIENT_ID =
  process.env.CLIENT_ID;

const GUILD_ID =
  process.env.GUILD_ID;

const db =
  new Database("db.db");

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
`);

function hasPermission(userId) {

  const row =
    db.prepare(`
      SELECT *
      FROM permissions
      WHERE userId = ?
    `).get(userId);

  return !!row;
}

const client =
  new Client({

    intents: [

      GatewayIntentBits.Guilds,

      GatewayIntentBits.GuildMessages,

      GatewayIntentBits.MessageContent

    ]
  });

const app =
  express();

app.get("/", (req, res) => {
  res.send("Bot online.");
});

app.listen(3000);

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
      "Perfil avanzado"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

async function registerCommands() {

  const rest =
    new REST({
      version: "10"
    }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(
      CLIENT_ID
    ),
    { body: [] }
  );

  await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      GUILD_ID
    ),
    { body: commands }
  );
}

client.once(
  "clientReady",
  async () => {

    console.log(
      `Bot online como ${client.user.tag}`
    );

    await registerCommands();
  }
);

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

client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isChatInputCommand()
    ) return;

    try {

      const isAdmin =
        interaction.memberPermissions?.has(
          PermissionFlagsBits.Administrator
        );

      const permitted =
        hasPermission(
          interaction.user.id
        );

      if (
        interaction.commandName ===
        "permission"
      ) {

        if (!isAdmin) {

          return interaction.reply({
            content:
              "Solo administradores.",
            ephemeral: true
          });
        }

        return permission.execute(
          interaction
        );
      }

      if (
        !isAdmin &&
        !permitted
      ) {

        return interaction.reply({
          content:
            "No tienes permisos.",
          ephemeral: true
        });
      }

      if (
        interaction.commandName ===
        "transcribe"
      ) {

        return transcribe.execute(
          interaction
        );
      }

      if (
        interaction.commandName ===
        "alt"
      ) {

        const user =
          interaction.options.getUser(
            "usuario"
          );

        const messages =
          db.prepare(`
            SELECT *
            FROM messages
            WHERE userId = ?
          `).all(user.id);

        let score = 0;

        if (
          messages.length > 50
        ) score += 20;

        const age =
          (
            Date.now()
            - user.createdTimestamp
          ) / 86400000;

        if (age < 7)
          score += 50;

        let level = "Bajo";

        if (score >= 70)
          level = "Alto";

        else if (score >= 40)
          level = "Medio";

        return interaction.reply({
          embeds: [

            new EmbedBuilder()

              .setTitle(
                "Análisis de usuario"
              )

              .setThumbnail(
                user.displayAvatarURL()
              )

              .setColor(
                score >= 70
                ? 0xED4245
                : score >= 40
                ? 0xFEE75C
                : 0x57F287
              )

              .addFields(

                {
                  name: "Usuario",
                  value: user.tag,
                  inline: true
                },

                {
                  name: "Score",
                  value:
                    `${score}/100`,
                  inline: true
                },

                {
                  name: "Nivel",
                  value:
                    level,
                  inline: true
                },

                {
                  name:
                    "Mensajes analizados",
                  value:
                    `${messages.length}`,
                  inline: true
                }

              )

          ]
        });
      }

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

        let similarity = 0;

        if (

          u1.username
            .slice(0, 3)
            .toLowerCase()

          ===

          u2.username
            .slice(0, 3)
            .toLowerCase()

        ) {

          similarity += 40;
        }

        return interaction.reply({
          embeds: [

            new EmbedBuilder()

              .setTitle(
                "Comparación"
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
                }

              )

          ]
        });
      }

      if (
        interaction.commandName ===
        "profile"
      ) {

        const user =
          interaction.options.getUser(
            "usuario"
          );

        const messages =
          db.prepare(`
            SELECT *
            FROM messages
            WHERE userId = ?
          `).all(user.id);

        return interaction.reply({
          embeds: [

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
                    `${messages.length}`,
                  inline: true
                }

              )

          ]
        });
      }

    }

    catch (err) {

      console.error(err);

      return interaction.reply({
        content:
          "Ocurrió un error.",
        ephemeral: true
      });
    }
  }
);

client.login(TOKEN);

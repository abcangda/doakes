const {
  SlashCommandBuilder
} = require("discord.js");

const Database =
require("better-sqlite3");

const db =
new Database("db.db");

const {
  createEmbed,
  gifs
} = require("./bot4");

const {
  isOwner
} = require("./bot3");

db.exec(`

CREATE TABLE IF NOT EXISTS echo_access (
  userId TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS echo_cooldowns (
  userId TEXT PRIMARY KEY,
  lastEveryone INTEGER
);

`);

function hasEcho(id) {

  if (isOwner(id))
    return true;

  return !!db.prepare(`
    SELECT * FROM echo_access
    WHERE userId = ?
  `).get(id);
}

const echoCommand =
new SlashCommandBuilder()

.setName("echo")

.setDescription("Hablar como Homelander")

.addStringOption(option =>
  option
  .setName("texto")
  .setDescription("Texto")
  .setRequired(true)
);

const addEcho =
new SlashCommandBuilder()

.setName("addecho")

.setDescription("Dar echo")

.addStringOption(option =>
  option
  .setName("id")
  .setDescription("ID")
  .setRequired(true)
);

const removeEcho =
new SlashCommandBuilder()

.setName("removeecho")

.setDescription("Quitar echo")

.addStringOption(option =>
  option
  .setName("id")
  .setDescription("ID")
  .setRequired(true)
);

const echoList =
new SlashCommandBuilder()

.setName("echolist")

.setDescription("Lista echo");

async function execute(interaction) {

  if (
    interaction.commandName === "echo"
  ) {

    if (!hasEcho(interaction.user.id)) {

      return interaction.reply({

        embeds:[
          createEmbed(
            "ACCESS DENIED",
            "Homelander rechazó tu solicitud.",
            gifs.deny
          )
        ],

        ephemeral:true
      });
    }

    const text =
    interaction.options.getString("texto");

    if (
      (
        text.includes("@everyone")
        ||
        text.includes("@here")
      )

      &&

      !isOwner(interaction.user.id)
    ) {

      const row =
      db.prepare(`
        SELECT * FROM echo_cooldowns
        WHERE userId = ?
      `).get(interaction.user.id);

      const now = Date.now();

      if (
        row &&
        now - row.lastEveryone
        < 259200000
      ) {

        return interaction.reply({

          content:
          "Cooldown de 3 días.",

          ephemeral:true
        });
      }

      db.prepare(`
        INSERT OR REPLACE INTO
        echo_cooldowns
        (userId,lastEveryone)
        VALUES (?,?)
      `).run(
        interaction.user.id,
        now
      );
    }

    await interaction.reply({
      content:"Transmitiendo...",
      ephemeral:true
    });

    return interaction.channel.send(text);
  }

  if (!isOwner(interaction.user.id)) {

    return interaction.reply({
      content:"Solo Homelander.",
      ephemeral:true
    });
  }

  if (
    interaction.commandName === "addecho"
  ) {

    const id =
    interaction.options.getString("id");

    db.prepare(`
      INSERT OR REPLACE INTO
      echo_access (userId)
      VALUES (?)
    `).run(id);

    return interaction.reply({
      content:`${id} agregado.`,
      ephemeral:true
    });
  }

  if (
    interaction.commandName === "removeecho"
  ) {

    const id =
    interaction.options.getString("id");

    db.prepare(`
      DELETE FROM echo_access
      WHERE userId = ?
    `).run(id);

    return interaction.reply({
      content:`${id} removido.`,
      ephemeral:true
    });
  }

  if (
    interaction.commandName === "echolist"
  ) {

    const rows =
    db.prepare(`
      SELECT * FROM echo_access
    `).all();

    return interaction.reply({

      content:

      rows.map(x=>x.userId)
      .join("\n")

      ||

      "Sin usuarios.",

      ephemeral:true
    });
  }
}

module.exports = {

  echoCommand,
  addEcho,
  removeEcho,
  echoList,
  execute
};

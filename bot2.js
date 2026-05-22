const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const Database =
  require("better-sqlite3");

const db =
  new Database("db.db");

const OWNER_ID =
  "1305030009681088592";

db.exec(`
CREATE TABLE IF NOT EXISTS echo_permissions (
  userId TEXT PRIMARY KEY
);
`);

function canUse(userId) {

  if (userId === OWNER_ID)
    return true;

  return !!db.prepare(`
    SELECT * FROM echo_permissions
    WHERE userId = ?
  `).get(userId);
}

const echoCommand =
  new SlashCommandBuilder()

    .setName("echo")

    .setDescription(
      "Hace hablar al bot"
    )

    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Texto")
        .setRequired(true)
    );

const addEchoCommand =
  new SlashCommandBuilder()

    .setName("addecho")

    .setDescription(
      "Da acceso echo"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    );

const removeEchoCommand =
  new SlashCommandBuilder()

    .setName("removeecho")

    .setDescription(
      "Quita acceso echo"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    );

const echoListCommand =
  new SlashCommandBuilder()

    .setName("echolist")

    .setDescription(
      "Lista permisos echo"
    );

async function execute(interaction) {

  if (
    interaction.commandName === "echo"
  ) {

    if (
      !canUse(interaction.user.id)
    ) {

      return interaction.reply({

        content:"No autorizado.",

        ephemeral:true
      });
    }

    const text =
      interaction.options.getString(
        "texto"
      );

    await interaction.reply({
      content:"Enviado.",
      ephemeral:true
    });

    return interaction.channel.send(text);
  }

  if (
    interaction.user.id !== OWNER_ID
  ) {

    return interaction.reply({

      content:"No autorizado.",

      ephemeral:true
    });
  }

  if (
    interaction.commandName === "addecho"
  ) {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      INSERT OR REPLACE INTO
      echo_permissions
      (userId)
      VALUES (?)
    `).run(user.id);

    return interaction.reply({
      content:`${user.tag} agregado.`,
      ephemeral:true
    });
  }

  if (
    interaction.commandName === "removeecho"
  ) {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      DELETE FROM echo_permissions
      WHERE userId = ?
    `).run(user.id);

    return interaction.reply({
      content:`${user.tag} removido.`,
      ephemeral:true
    });
  }

  if (
    interaction.commandName === "echolist"
  ) {

    const rows =
      db.prepare(`
        SELECT * FROM echo_permissions
      `).all();

    return interaction.reply({

      embeds:[

        new EmbedBuilder()

          .setColor(0x0A0A0A)

          .setTitle(
            "AUTHORIZED ECHO USERS"
          )

          .setDescription(

            rows.map(
              x=>`<@${x.userId}>`
            ).join("\n")

            ||

            "Sin usuarios."

          )

      ],

      ephemeral:true
    });
  }
}

module.exports = {
  echoCommand,
  addEchoCommand,
  removeEchoCommand,
  echoListCommand,
  execute
};

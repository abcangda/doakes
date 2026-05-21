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
CREATE TABLE IF NOT EXISTS transcribe_permissions (
  userId TEXT PRIMARY KEY
);
`);

function canUseTranscribe(
  userId
) {

  if (userId === OWNER_ID)
    return true;

  const row =
    db.prepare(`
      SELECT *
      FROM transcribe_permissions
      WHERE userId = ?
    `).get(userId);

  return !!row;
}

const transcribeCommand =
  new SlashCommandBuilder()

    .setName("transcribe")

    .setDescription(
      "Hace que el bot escriba"
    )

    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Texto")
        .setRequired(true)
    );

const addCommand =
  new SlashCommandBuilder()

    .setName("addtranscribe")

    .setDescription(
      "Da acceso a transcribe"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    );

const removeCommand =
  new SlashCommandBuilder()

    .setName("removetranscribe")

    .setDescription(
      "Quita acceso a transcribe"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    );

async function execute(
  interaction
) {

  if (
    interaction.commandName ===
    "transcribe"
  ) {

    if (
      !canUseTranscribe(
        interaction.user.id
      )
    ) {

      return interaction.reply({

        content:
          "No puedes usar este comando.",

        ephemeral: true

      });
    }

    const text =
      interaction.options.getString(
        "texto"
      );

    await interaction.reply({

      content:
        "Mensaje enviado.",

      ephemeral: true

    });

    return interaction.channel.send(
      text
    );
  }

  if (
    interaction.user.id !==
    OWNER_ID
  ) {

    return interaction.reply({

      content:
        "No puedes usar este comando.",

      ephemeral: true

    });
  }

  if (
    interaction.commandName ===
    "addtranscribe"
  ) {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      INSERT OR REPLACE INTO
      transcribe_permissions
      (userId)
      VALUES (?)
    `).run(user.id);

    return interaction.reply({

      embeds: [

        new EmbedBuilder()

          .setTitle(
            "Acceso agregado"
          )

          .setDescription(
            `${user.tag} ahora puede usar transcribe.`
          )

          .setColor(
            0x57F287
          )

      ]

    });
  }

  if (
    interaction.commandName ===
    "removetranscribe"
  ) {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      DELETE FROM
      transcribe_permissions
      WHERE userId = ?
    `).run(user.id);

    return interaction.reply({

      embeds: [

        new EmbedBuilder()

          .setTitle(
            "Acceso removido"
          )

          .setDescription(
            `${user.tag} ya no puede usar transcribe.`
          )

          .setColor(
            0xED4245
          )

      ]

    });
  }
}

module.exports = {

  transcribeCommand,

  addCommand,

  removeCommand,

  execute
};

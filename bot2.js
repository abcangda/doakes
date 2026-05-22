const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const Database = require("better-sqlite3");

const db = new Database("db.db");

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
      "Hace hablar al sistema"
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
      "Da acceso"
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
      "Quita acceso"
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    );

async function execute(interaction) {

  if (
    interaction.commandName === "echo"
  ) {

    if (!canUse(interaction.user.id)) {

      return interaction.reply({

        embeds: [

          new EmbedBuilder()
            .setColor(0x0A0A0A)
            .setTitle("ACCESS DENIED")
            .setDescription(
              "Homelander rechazó la transmisión."
            )
            .setImage(
              "https://cdn.discordapp.com/attachments/1494932411702710312/1507467086182613173/image0.gif?ex=6a1201a0&is=6a10b020&hm=8339f4069c66da70af9c9de5da031dc253c62225126292fd71ef278e16e30b46&"
            )

        ],

        ephemeral: true
      });
    }

    const text =
      interaction.options.getString(
        "texto"
      );

    await interaction.reply({
      content: "Mensaje enviado.",
      ephemeral: true
    });

    return interaction.channel.send(text);
  }

  if (
    interaction.user.id !== OWNER_ID
  ) {

    return interaction.reply({
      content: "No autorizado.",
      ephemeral: true
    });
  }

  const user =
    interaction.options.getUser(
      "usuario"
    );

  if (
    interaction.commandName === "addecho"
  ) {

    db.prepare(`
      INSERT OR REPLACE INTO
      echo_permissions
      (userId)
      VALUES (?)
    `).run(user.id);

    return interaction.reply({

      embeds: [

        new EmbedBuilder()
          .setColor(0x0A0A0A)
          .setTitle("ACCESS GRANTED")
          .setDescription(
            `${user.tag} ahora puede usar Echo.`
          )
          .setImage(
            "https://cdn.discordapp.com/attachments/1494932411702710312/1507487015065878558/image0.gif?ex=6a121430&is=6a10c2b0&hm=8d4aedc1166df6c662117fb772c14fefc161d85ba1f8de039b399df660b865c7&"
          )

      ]
    });
  }

  if (
    interaction.commandName === "removeecho"
  ) {

    db.prepare(`
      DELETE FROM echo_permissions
      WHERE userId = ?
    `).run(user.id);

    return interaction.reply({

      embeds: [

        new EmbedBuilder()
          .setColor(0x0A0A0A)
          .setTitle("ACCESS REVOKED")
          .setDescription(
            `${user.tag} perdió acceso a Echo.`
          )
          .setImage(
            "https://cdn.discordapp.com/attachments/1494932411702710312/1507486803471503502/image0.gif?ex=6a1213fd&is=6a10c27d&hm=ed8d86f49456bd75709c899f720387e7038d0fb879cb859647bbeaab92790aa6&"
          )

      ]
    });
  }
}

module.exports = {
  echoCommand,
  addEchoCommand,
  removeEchoCommand,
  execute
};

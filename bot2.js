const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const command =
  new SlashCommandBuilder()

    .setName("transcribe")

    .setDescription(
      "Hace que el bot escriba un mensaje"
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Texto")
        .setRequired(true)
    );

async function execute(interaction) {

  const text =
    interaction.options.getString(
      "texto"
    );

  // RESPUESTA INVISIBLE

  await interaction.reply({
    content: "Mensaje enviado.",
    ephemeral: true
  });

  // MENSAJE REAL DEL BOT

  await interaction.channel.send({
    content: text
  });
}

module.exports = {
  command,
  execute
};

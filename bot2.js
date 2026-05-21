const {
  SlashCommandBuilder
} = require("discord.js");

const command =
  new SlashCommandBuilder()
    .setName("transcribe")
    .setDescription("Hace que el bot escriba")
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

  await interaction.reply({
    content: "Mensaje enviado.",
    ephemeral: true
  });

  await interaction.channel.send(text);
}

module.exports = {
  command,
  execute
};

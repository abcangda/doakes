const { SlashCommandBuilder, REST, Routes } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("alt")
    .setDescription("analiza un usuario para detectar posibles alts")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("usuario a analizar")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("compare")
    .setDescription("compara dos usuarios y analiza similitud")
    .addUserOption(option =>
      option
        .setName("u1")
        .setDescription("primer usuario")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("u2")
        .setDescription("segundo usuario")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

client.once("ready", async () => {
  console.log("bot online como:", client.user.tag);

  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("slash commands registrados correctamente");

  } catch (err) {
    console.error("error registrando comandos:", err);
  }
});

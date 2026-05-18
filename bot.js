const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= COMMANDS =================
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
    .setDescription("compara dos usuarios")
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
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
  console.log("bot online como:", client.user.tag);

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("slash commands registrados correctamente");
  } catch (err) {
    console.error("error registrando comandos:", err);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {

    if (interaction.commandName === "alt") {
      const user = interaction.options.getUser("usuario");

      await interaction.deferReply();

      await new Promise(r => setTimeout(r, 1000));

      return interaction.editReply(
        `analizando usuario: ${user.tag}`
      );
    }

    if (interaction.commandName === "compare") {
      const u1 = interaction.options.getUser("u1");
      const u2 = interaction.options.getUser("u2");

      await interaction.deferReply();

      await new Promise(r => setTimeout(r, 1000));

      return interaction.editReply(
        `comparando ${u1.tag} vs ${u2.tag}`
      );
    }

  } catch (err) {
    console.error(err);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("error ejecutando comando");
    } else {
      await interaction.reply("error ejecutando comando");
    }
  }
});

// ================= LOGIN =================
client.login(TOKEN);

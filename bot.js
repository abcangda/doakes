const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

// ================= ENV =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
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
].map(cmd => cmd.toJSON());

// ================= READY =================
client.once("ready", async () => {
  console.log("bot online como:", client.user.tag);

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("slash commands registrados");

  } catch (err) {
    console.error("error registrando comandos:", err);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "alt") {
    const user = interaction.options.getUser("usuario");

    return interaction.reply({
      content: `analizando usuario: ${user.tag}`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "compare") {
    const u1 = interaction.options.getUser("u1");
    const u2 = interaction.options.getUser("u2");

    return interaction.reply({
      content: `comparando ${u1.tag} vs ${u2.tag}`,
      ephemeral: true
    });
  }
});

// ================= LOGIN =================
client.login(TOKEN);

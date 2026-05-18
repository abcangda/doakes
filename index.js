const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const mensajes = new Map();

const commands = [

  new SlashCommandBuilder()
    .setName('alt')
    .setDescription('analiza posible alt')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('usuario')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('compare')
    .setDescription('compara dos usuarios')
    .addUserOption(option =>
      option
        .setName('usuario1')
        .setDescription('primer usuario')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('usuario2')
        .setDescription('segundo usuario')
        .setRequired(true)
    )

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log('comandos cargados');

  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`doakes online`);
});

client.on('messageCreate', message => {

  if (message.author.bot) return;

  if (!mensajes.has(message.author.id)) {
    mensajes.set(message.author.id, []);
  }

  mensajes.get(message.author.id).push(message.content);

});

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'alt') {

    const usuario =
      interaction.options.getUser('usuario');

    const member =
      await interaction.guild.members.fetch(usuario.id);

    const diasCuenta =
      Math.floor(
        (Date.now() - usuario.createdTimestamp)
        / (1000 * 60 * 60 * 24)
      );

    let riesgo = 0;

    if (diasCuenta < 7) riesgo += 40;

    const similares =
      interaction.guild.members.cache.filter(m =>
        m.user.username
          .toLowerCase()
          .includes(
            usuario.username
              .toLowerCase()
              .substring(0, 4)
          )
      );

    if (similares.size > 1)
      riesgo += 20;

    const joins =
      interaction.guild.members.cache.filter(m => {

        const diff =
          Math.abs(
            m.joinedTimestamp -
            member.joinedTimestamp
          );

        return diff < 300000;
      });

    if (joins.size > 2)
      riesgo += 20;

    await interaction.reply(`

analisis de alt

usuario: ${usuario.tag}

edad de cuenta: ${diasCuenta} dias

cuenta nueva:
${diasCuenta < 7 ? 'si' : 'no'}

usernames parecidos:
${similares.size - 1}

joins cercanos:
${joins.size - 1}

riesgo estimado:
${riesgo}%

`);

  }

  if (interaction.commandName === 'compare') {

    const u1 =
      interaction.options.getUser('usuario1');

    const u2 =
      interaction.options.getUser('usuario2');

    const mensajes1 =
      mensajes.get(u1.id) || [];

    const mensajes2 =
      mensajes.get(u2.id) || [];

    let similitud = 0;

    if (
      u1.username
        .substring(0, 4)
        .toLowerCase()
      ===
      u2.username
        .substring(0, 4)
        .toLowerCase()
    ) {
      similitud += 30;
    }

    if (
      mensajes1.length > 0 &&
      mensajes2.length > 0
    ) {
      similitud += 20;
    }

    await interaction.reply(`

comparacion de usuarios

usuario 1:
${u1.tag}

usuario 2:
${u2.tag}

similitud de username:
${similitud >= 30 ? 'alta' : 'baja'}

mensajes analizados:
${mensajes1.length + mensajes2.length}

riesgo de alt:
${similitud}%

`);

  }

});

client.login(TOKEN);

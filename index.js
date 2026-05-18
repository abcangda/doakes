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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

const mensajes = new Map();
const usuariosBaneados = new Map();

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

  console.log('doakes online');

});

client.on('guildBanAdd', ban => {

  usuariosBaneados.set(ban.user.id, {
    username: ban.user.username.toLowerCase(),
    fecha: Date.now()
  });

});

client.on('messageCreate', message => {

  if (message.author.bot) return;

  if (!mensajes.has(message.author.id)) {
    mensajes.set(message.author.id, []);
  }

  mensajes.get(message.author.id).push({
    contenido: message.content,
    hora: Date.now()
  });

  if (mensajes.get(message.author.id).length > 100) {
    mensajes.get(message.author.id).shift();
  }

});

function obtenerPalabras(listaMensajes) {

  return listaMensajes
    .map(m => m.contenido)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ ]/gi, '')
    .split(/\s+/)
    .filter(p => p.length > 3);

}

function porcentajeMayusculas(listaMensajes) {

  const texto = listaMensajes
    .map(m => m.contenido)
    .join('');

  if (!texto.length) return 0;

  const mayus = texto
    .split('')
    .filter(c => c === c.toUpperCase() && /[A-Z]/i.test(c))
    .length;

  return Math.floor((mayus / texto.length) * 100);

}

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'alt') {

    const usuario = interaction.options.getUser('usuario');

    const member =
      await interaction.guild.members.fetch(usuario.id);

    const diasCuenta = Math.floor(
      (Date.now() - usuario.createdTimestamp)
      / (1000 * 60 * 60 * 24)
    );

    let riesgo = 0;

    if (diasCuenta < 7) riesgo += 40;
    else if (diasCuenta < 30) riesgo += 20;

    const similares =
      interaction.guild.members.cache.filter(m => {

        const nombre1 =
          m.user.username.toLowerCase();

        const nombre2 =
          usuario.username.toLowerCase();

        return (
          nombre1 !== nombre2 &&
          (
            nombre1.includes(nombre2.substring(0, 4)) ||
            nombre2.includes(nombre1.substring(0, 4))
          )
        );

      });

    if (similares.size >= 1)
      riesgo += 20;

    const joins =
      interaction.guild.members.cache.filter(m => {

        const diff = Math.abs(
          m.joinedTimestamp -
          member.joinedTimestamp
        );

        return diff < 300000;

      });

    if (joins.size > 2)
      riesgo += 20;

    let evasion = 'no';

    usuariosBaneados.forEach(b => {

      if (
        usuario.username
          .toLowerCase()
          .includes(
            b.username.substring(0, 4)
          )
      ) {
        riesgo += 30;
        evasion = 'posible';
      }

    });

    let nivel = 'bajo';

    if (riesgo >= 70)
      nivel = 'alto';

    else if (riesgo >= 40)
      nivel = 'medio';

    await interaction.reply(`
analisis de alt

usuario:
${usuario.tag}

id:
${usuario.id}

edad de cuenta:
${diasCuenta} dias

cuenta nueva:
${diasCuenta < 30 ? 'si' : 'no'}

usernames parecidos:
${similares.size}

joins cercanos:
${joins.size - 1}

posible evasion:
${evasion}

riesgo estimado:
${riesgo}%

nivel:
${nivel}
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

    const palabras1 =
      obtenerPalabras(mensajes1);

    const palabras2 =
      obtenerPalabras(mensajes2);

    const comunes =
      palabras1.filter(p =>
        palabras2.includes(p)
      );

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

    if (comunes.length > 10)
      similitud += 30;

    const promedio1 =
      mensajes1
        .map(m => m.contenido.length)
        .reduce((a, b) => a + b, 0)
      / (mensajes1.length || 1);

    const promedio2 =
      mensajes2
        .map(m => m.contenido.length)
        .reduce((a, b) => a + b, 0)
      / (mensajes2.length || 1);

    if (
      Math.abs(promedio1 - promedio2) < 8
    ) {
      similitud += 20;
    }

    const mayus1 = porcentajeMayusculas(mensajes1);
    const mayus2 = porcentajeMayusculas(mensajes2);

    if (
      Math.abs(mayus1 - mayus2) < 10
    ) {
      similitud += 10;
    }

    let nivel = 'bajo';

    if (similitud >= 70)
      nivel = 'alto';

    else if (similitud >= 40)
      nivel = 'medio';

    await interaction.reply(`
comparacion de usuarios

usuario 1:
${u1.tag}

usuario 2:
${u2.tag}

mensajes analizados:
${mensajes1.length + mensajes2.length}

palabras similares:
${comunes.length}

similitud de escritura:
${nivel}

riesgo de alt:
${similitud}%
`);

  }

});

client.login(TOKEN);

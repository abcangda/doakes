const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const express = require("express");
const Database = require("better-sqlite3");

const echo = require("./bot2");
const access = require("./bot3");
const ban = require("./bot4");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const db = new Database("db.db");

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  content TEXT,
  createdAt INTEGER
);
`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const app = express();

app.get("/", (req,res)=>{
  res.send("Homelander online.");
});

app.listen(3000);

function topKey(obj) {

  return Object.keys(obj)
    .sort((a,b)=>obj[b]-obj[a])[0];
}

const commands = [

  echo.echoCommand,
  echo.addEchoCommand,
  echo.removeEchoCommand,
  echo.echoListCommand,

  access.command,

  ban.command,

  new SlashCommandBuilder()

    .setName("scan")

    .setDescription("Escanea un usuario")

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()

    .setName("file")

    .setDescription("Expediente completo")

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()

    .setName("intel")

    .setDescription("Analiza similitud")

    .addUserOption(option =>
      option
        .setName("u1")
        .setDescription("Usuario 1")
        .setRequired(true)
    )

    .addUserOption(option =>
      option
        .setName("u2")
        .setDescription("Usuario 2")
        .setRequired(true)
    )

].map(x=>x.toJSON());

async function registerCommands() {

  const rest = new REST({
    version:"10"
  }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: [] }
  );

  await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      GUILD_ID
    ),
    { body: commands }
  );
}

client.once("clientReady", async ()=>{

  console.log(`ONLINE ${client.user.tag}`);

  await registerCommands();
});

client.on("messageCreate", message=>{

  if (message.author.bot)
    return;

  db.prepare(`
    INSERT INTO messages (
      userId,
      content,
      createdAt
    )
    VALUES (?, ?, ?)
  `).run(
    message.author.id,
    message.content,
    Date.now()
  );
});

client.on("interactionCreate", async interaction=>{

  if (!interaction.isChatInputCommand())
    return;

  try {

    if (
      interaction.commandName === "echo"
      ||
      interaction.commandName === "addecho"
      ||
      interaction.commandName === "removeecho"
      ||
      interaction.commandName === "echolist"
    ) {
      return echo.execute(interaction);
    }

    if (
      interaction.commandName === "access"
    ) {
      return access.execute(interaction);
    }

    if (
      interaction.commandName === "ban"
    ) {
      return ban.execute(interaction);
    }

    if (
      interaction.commandName === "scan"
    ) {

      const user =
        interaction.options.getUser("usuario");

      const messages = db.prepare(`
        SELECT * FROM messages
        WHERE userId = ?
      `).all(user.id);

      let score = 0;

      const age =
        (Date.now() - user.createdTimestamp)
        / 86400000;

      if (age < 7)
        score += 50;

      if (messages.length < 20)
        score += 20;

      const risk =
        score >= 70
        ? "HIGH"
        : score >= 40
        ? "MEDIUM"
        : "LOW";

      return interaction.reply({

        embeds: [

          new EmbedBuilder()

            .setColor(0x0A0A0A)

            .setTitle("VOUGHT THREAT ANALYSIS")

            .setDescription(
              "Análisis completado."
            )

            .setThumbnail(
              user.displayAvatarURL()
            )

            .addFields(

              {
                name:"Usuario",
                value:user.tag,
                inline:true
              },

              {
                name:"Threat Score",
                value:`${score}/100`,
                inline:true
              },

              {
                name:"Threat Level",
                value:risk,
                inline:true
              }

            )

            .setImage(
              score >= 70
              ? "https://cdn.discordapp.com/attachments/1494932411702710312/1507467664933519440/image0.gif?ex=6a12022a&is=6a10b0aa&hm=9338b5fbf6feaa55d7b580f890c4a81f185ff916efbeb949045e996042d06577&"
              : "https://cdn.discordapp.com/attachments/1494932411702710312/1507487015065878558/image0.gif?ex=6a121430&is=6a10c2b0&hm=8d4aedc1166df6c662117fb772c14fefc161d85ba1f8de039b399df660b865c7&"
            )

        ]
      });
    }

    if (
      interaction.commandName === "file"
    ) {

      const user =
        interaction.options.getUser("usuario");

      const member =
        await interaction.guild.members.fetch(
          user.id
        );

      const messages = db.prepare(`
        SELECT * FROM messages
        WHERE userId = ?
      `).all(user.id);

      let words = {};
      let hours = {};

      for (const msg of messages) {

        for (const word of msg.content
          .toLowerCase()
          .split(/\s+/)) {

          if (word.length < 4)
            continue;

          words[word] =
            (words[word] || 0) + 1;
        }

        const h =
          new Date(msg.createdAt)
          .getHours();

        hours[h] =
          (hours[h] || 0) + 1;
      }

      return interaction.reply({

        embeds:[

          new EmbedBuilder()

            .setColor(0x0A0A0A)

            .setTitle("VOUGHT USER FILE")

            .setThumbnail(
              user.displayAvatarURL()
            )

            .addFields(

              {
                name:"Usuario",
                value:user.tag,
                inline:true
              },

              {
                name:"Display",
                value:member.displayName,
                inline:true
              },

              {
                name:"Mensajes",
                value:`${messages.length}`,
                inline:true
              },

              {
                name:"Palabra favorita",
                value:topKey(words) || "Ninguna",
                inline:true
              },

              {
                name:"Hora activa",
                value:`${topKey(hours)||0}:00`,
                inline:true
              }

            )

            .setImage(
              "https://cdn.discordapp.com/attachments/1494932411702710312/1507487015065878558/image0.gif?ex=6a121430&is=6a10c2b0&hm=8d4aedc1166df6c662117fb772c14fefc161d85ba1f8de039b399df660b865c7&"
            )

        ]
      });
    }

    if (
      interaction.commandName === "intel"
    ) {

      const u1 =
        interaction.options.getUser("u1");

      const u2 =
        interaction.options.getUser("u2");

      let similarity = 0;

      if (
        u1.username.slice(0,3)
        .toLowerCase()

        ===

        u2.username.slice(0,3)
        .toLowerCase()
      ) {
        similarity += 20;
      }

      const level =
        similarity >= 70
        ? "HIGH"
        : similarity >= 40
        ? "MEDIUM"
        : "LOW";

      return interaction.reply({

        embeds:[

          new EmbedBuilder()

            .setColor(0x0A0A0A)

            .setTitle(
              "VOUGHT INTELLIGENCE REPORT"
            )

            .addFields(

              {
                name:"Usuario 1",
                value:u1.tag,
                inline:true
              },

              {
                name:"Usuario 2",
                value:u2.tag,
                inline:true
              },

              {
                name:"Compatibilidad",
                value:`${similarity}% • ${level}`,
                inline:true
              }

            )

            .setImage(
              similarity >= 70
              ? "https://cdn.discordapp.com/attachments/1494932411702710312/1507467664933519440/image0.gif?ex=6a12022a&is=6a10b0aa&hm=9338b5fbf6feaa55d7b580f890c4a81f185ff916efbeb949045e996042d06577&"
              : "https://cdn.discordapp.com/attachments/1494932411702710312/1507486803471503502/image0.gif?ex=6a1213fd&is=6a10c27d&hm=ed8d86f49456bd75709c899f720387e7038d0fb879cb859647bbeaab92790aa6&"
            )

        ]
      });
    }

  }

  catch(err) {

    console.error(err);
  }
});

client.login(TOKEN);

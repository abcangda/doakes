const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const express = require("express");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const app = express();

app.get("/", (req,res)=>{
  res.send("Homelander online.");
});

app.listen(3000);

const commands = [

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
    .setDescription("Compara usuarios")
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
    ),

  new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Hace hablar al bot")
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Texto")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banear usuario")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )

].map(command => command.toJSON());

async function registerCommands() {

  const rest = new REST({
    version: "10"
  }).setToken(TOKEN);

  try {

    console.log("Limpiando comandos...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] }
    );

    console.log("Registrando comandos...");

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
      { body: commands }
    );

    console.log("Comandos registrados.");

  } catch(err) {

    console.error(err);
  }
}

client.once("ready", async ()=>{

  console.log(`${client.user.tag} online`);

  await registerCommands();
});

client.on("interactionCreate", async interaction=>{

  if (!interaction.isChatInputCommand())
    return;

  try {

    if (interaction.commandName === "scan") {

      const user =
        interaction.options.getUser("usuario");

      return interaction.reply({

        embeds:[

          new EmbedBuilder()

            .setColor(0x0A0A0A)

            .setTitle(
              "VOUGHT THREAT ANALYSIS"
            )

            .setDescription(
              `${user.tag} fue analizado.`
            )

            .setThumbnail(
              user.displayAvatarURL()
            )

            .addFields(

              {
                name:"Threat Level",
                value:"LOW",
                inline:true
              },

              {
                name:"Classification",
                value:"Civilian",
                inline:true
              }

            )

            .setImage(
              "https://cdn.discordapp.com/attachments/1494932411702710312/1507487015065878558/image0.gif?ex=6a121430&is=6a10c2b0&hm=8d4aedc1166df6c662117fb772c14fefc161d85ba1f8de039b399df660b865c7&"
            )

        ]

      });
    }

    if (interaction.commandName === "file") {

      const user =
        interaction.options.getUser("usuario");

      return interaction.reply({

        embeds:[

          new EmbedBuilder()

            .setColor(0x0A0A0A)

            .setTitle(
              "VOUGHT USER FILE"
            )

            .setDescription(
              `Expediente de ${user.tag}`
            )

            .setThumbnail(
              user.displayAvatarURL()
            )

            .addFields(

              {
                name:"Cuenta creada",
                value:`<t:${parseInt(user.createdTimestamp / 1000)}:R>`
              },

              {
                name:"Usuario ID",
                value:user.id
              }

            )

            .setImage(
              "https://cdn.discordapp.com/attachments/1494932411702710312/1507486803471503502/image0.gif?ex=6a1213fd&is=6a10c27d&hm=ed8d86f49456bd75709c899f720387e7038d0fb879cb859647bbeaab92790aa6&"
            )

        ]

      });
    }

    if (interaction.commandName === "intel") {

      const u1 =
        interaction.options.getUser("u1");

      const u2 =
        interaction.options.getUser("u2");

      let similarity = 20;

      if (
        u1.username
          .slice(0,3)
          .toLowerCase()

        ===

        u2.username
          .slice(0,3)
          .toLowerCase()
      ) {
        similarity += 40;
      }

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
                name:"Coincidencia",
                value:`${similarity}%`,
                inline:true
              }

            )

            .setImage(
              similarity >= 60

              ?

              "https://cdn.discordapp.com/attachments/1494932411702710312/1507467664933519440/image0.gif?ex=6a12022a&is=6a10b0aa&hm=9338b5fbf6feaa55d7b580f890c4a81f185ff916efbeb949045e996042d06577&"

              :

              "https://cdn.discordapp.com/attachments/1494932411702710312/1507467086182613173/image0.gif?ex=6a1201a0&is=6a10b020&hm=8339f4069c66da70af9c9de5da031dc253c62225126292fd71ef278e16e30b46&"
            )

        ]

      });
    }

    if (interaction.commandName === "echo") {

      const text =
        interaction.options.getString(
          "texto"
        );

      await interaction.reply({
        content:"Transmitiendo...",
        ephemeral:true
      });

      return interaction.channel.send(text);
    }

    if (interaction.commandName === "ban") {

      if (
        interaction.user.id !==
        "1305030009681088592"
      ) {

        return interaction.reply({

          content:
            "Homelander rechazó tu solicitud.",

          ephemeral:true
        });
      }

      const user =
        interaction.options.getUser(
          "usuario"
        );

      const member =
        await interaction.guild.members
          .fetch(user.id);

      await member.ban();

      await interaction.reply({
        content:"Objetivo eliminado.",
        ephemeral:true
      });

      return interaction.channel.send({

        embeds:[

          new EmbedBuilder()

            .setColor(0x0A0A0A)

            .setTitle(
              "TARGET ELIMINATED"
            )

            .setDescription(
              `Homelander asesinó a ${user.tag}.`
            )

            .setImage(
              "https://cdn.discordapp.com/attachments/1494932411702710312/1507467664933519440/image0.gif?ex=6a12022a&is=6a10b0aa&hm=9338b5fbf6feaa55d7b580f890c4a81f185ff916efbeb949045e996042d06577&"
            )

        ]

      });
    }

  } catch(err) {

    console.error(err);

    if (!interaction.replied) {

      interaction.reply({

        content:"Error interno.",

        ephemeral:true
      });
    }
  }
});

client.login(TOKEN);

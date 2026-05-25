const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const express =
require("express");

const Database =
require("better-sqlite3");

const db =
new Database("db.db");

const {
  createEmbed,
  gifs
} = require("./bot4");

const echo =
require("./bot2");

const access =
require("./bot3");

const {
  hasMod
} = require("./bot3");

const TOKEN =
process.env.TOKEN;

const CLIENT_ID =
process.env.CLIENT_ID;

const GUILD_ID =
process.env.GUILD_ID;

db.exec(`

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  content TEXT,
  createdAt INTEGER
);

`);

const client =
new Client({

  intents:[

    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers

  ]
});

const app =
express();

app.get("/",(req,res)=>{
  res.send("Homelander online.");
});

app.listen(3000);

const commands = [

  echo.echoCommand,
  echo.addEcho,
  echo.removeEcho,
  echo.echoList,

  access.command,

  new SlashCommandBuilder()

  .setName("scan")

  .setDescription("Escaneo")

  .addUserOption(option =>
    option
    .setName("usuario")
    .setDescription("Usuario")
    .setRequired(true)
  ),

  new SlashCommandBuilder()

  .setName("file")

  .setDescription("Expediente")

  .addUserOption(option =>
    option
    .setName("usuario")
    .setDescription("Usuario")
    .setRequired(true)
  ),

  new SlashCommandBuilder()

  .setName("intel")

  .setDescription("Comparar usuarios")

  .addUserOption(option =>
    option
    .setName("u1")
    .setDescription("Usuario")
    .setRequired(true)
  )

  .addUserOption(option =>
    option
    .setName("u2")
    .setDescription("Usuario")
    .setRequired(true)
  ),

  new SlashCommandBuilder()

  .setName("ban")

  .setDescription("Eliminar objetivo")

  .addUserOption(option =>
    option
    .setName("usuario")
    .setDescription("Usuario")
    .setRequired(true)
  ),

  new SlashCommandBuilder()

  .setName("laser")

  .setDescription("Laser vision")

  .addUserOption(option =>
    option
    .setName("usuario")
    .setDescription("Usuario")
    .setRequired(true)
  )

].map(x=>x.toJSON());

async function registerCommands() {

  const rest =
  new REST({
    version:"10"
  }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(
      CLIENT_ID
    ),
    { body:[] }
  );

  await rest.put(

    Routes.applicationGuildCommands(
      CLIENT_ID,
      GUILD_ID
    ),

    { body:commands }
  );
}

client.once("ready", async ()=>{

  console.log(
    `${client.user.tag} online`
  );

  await registerCommands();
});

client.on("messageCreate", msg=>{

  if (msg.author.bot)
    return;

  db.prepare(`
    INSERT INTO messages
    (userId,content,createdAt)
    VALUES (?,?,?)
  `).run(
    msg.author.id,
    msg.content,
    Date.now()
  );
});

client.on(
"interactionCreate",
async interaction=>{

  if (!interaction.isChatInputCommand())
    return;

  try {

    if (
      [
        "echo",
        "addecho",
        "removeecho",
        "echolist"
      ]
      .includes(interaction.commandName)
    ) {
      return echo.execute(interaction);
    }

    if (
      interaction.commandName === "access"
    ) {
      return access.execute(interaction);
    }

    if (
      interaction.commandName === "scan"
    ) {

      const user =
      interaction.options.getUser(
        "usuario"
      );

      return interaction.reply({

        embeds:[

          createEmbed(
            "VOUGHT THREAT ANALYSIS",
            `${user.tag} fue analizado.`,
            gifs.stronger
          )

        ]
      });
    }

    if (
      interaction.commandName === "file"
    ) {

      const user =
      interaction.options.getUser(
        "usuario"
      );

      const count =
      db.prepare(`
        SELECT COUNT(*) as total
        FROM messages
        WHERE userId = ?
      `).get(user.id);

      return interaction.reply({

        embeds:[

          createEmbed(
            "VOUGHT USER FILE",
            `
Usuario:
${user.tag}

Mensajes:
${count.total}

ID:
${user.id}
            `,
            gifs.milk
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

      let score =
      Math.floor(
        Math.random()*100
      );

      return interaction.reply({

        embeds:[

          createEmbed(
            "VOUGHT INTELLIGENCE",
            `
${u1.tag}
vs
${u2.tag}

Coincidencia:
${score}%
            `,
            score >= 70
            ? gifs.danger
            : gifs.disgust
          )

        ]
      });
    }

    if (
      interaction.commandName === "ban"
    ) {

      if (
        !hasMod(interaction.user.id)
      ) {

        return interaction.reply({

          embeds:[

            createEmbed(
              "ACCESS DENIED",
              "Homelander rechazó tu solicitud.",
              gifs.deny
            )

          ],

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

          createEmbed(
            "TARGET ELIMINATED",
            `Homelander asesinó a ${user.tag}.`,
            gifs.danger
          )

        ]
      });
    }

    if (
      interaction.commandName === "laser"
    ) {

      if (
        !hasMod(interaction.user.id)
      ) {

        return interaction.reply({

          content:"Acceso denegado.",

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

      await member.setNickname(
        "Killed by Homelander"
      );

      return interaction.reply({

        embeds:[

          createEmbed(
            "LASER VISION",
            `${user.tag} fue destruido.`,
            gifs.danger
          )

        ]
      });
    }

  }

  catch(err) {

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

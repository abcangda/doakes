const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const Database =
  require("better-sqlite3");

const db =
  new Database("db.db");

db.exec(`
CREATE TABLE IF NOT EXISTS permissions (
  userId TEXT PRIMARY KEY
);
`);

const command =
  new SlashCommandBuilder()

    .setName("permission")

    .setDescription(
      "Gestiona permisos"
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("Da acceso")
        .addUserOption(option =>
          option
            .setName("usuario")
            .setDescription("Usuario")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("remove")
        .setDescription("Quita acceso")
        .addUserOption(option =>
          option
            .setName("usuario")
            .setDescription("Usuario")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("list")
        .setDescription("Lista usuarios")
    )

    .addSubcommand(sub =>
      sub
        .setName("removerole")
        .setDescription("Quita un rol")
        .addUserOption(option =>
          option
            .setName("usuario")
            .setDescription("Usuario")
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName("rol")
            .setDescription("Rol")
            .setRequired(true)
        )
    );

async function execute(
  interaction
) {

  const sub =
    interaction.options.getSubcommand();

  if (sub === "add") {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      INSERT OR REPLACE INTO permissions
      (userId)
      VALUES (?)
    `).run(user.id);

    return interaction.reply({

      embeds: [

        new EmbedBuilder()

          .setTitle(
            "Permiso agregado"
          )

          .setDescription(
            `${user.tag} ahora puede usar el bot.`
          )

          .setColor(
            0x57F287
          )

      ]

    });
  }

  if (sub === "remove") {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      DELETE FROM permissions
      WHERE userId = ?
    `).run(user.id);

    return interaction.reply({

      embeds: [

        new EmbedBuilder()

          .setTitle(
            "Permiso removido"
          )

          .setDescription(
            `${user.tag} ya no puede usar el bot.`
          )

          .setColor(
            0xED4245
          )

      ]

    });
  }

  if (sub === "list") {

    const rows =
      db.prepare(`
        SELECT *
        FROM permissions
      `).all();

    let users = "";

    for (const row of rows) {

      users +=
        `<@${row.userId}>\n`;
    }

    if (!users)
      users = "Sin usuarios.";

    return interaction.reply({

      embeds: [

        new EmbedBuilder()

          .setTitle(
            "Usuarios autorizados"
          )

          .setDescription(users)

          .setColor(
            0x5865F2
          )

      ]

    });
  }

  if (sub === "removerole") {

    const member =
      interaction.options.getMember(
        "usuario"
      );

    const role =
      interaction.options.getRole(
        "rol"
      );

    if (!member) {

      return interaction.reply({

        content:
          "Usuario no encontrado.",

        ephemeral: true

      });
    }

    if (
      !member.roles.cache.has(
        role.id
      )
    ) {

      return interaction.reply({

        content:
          "Ese usuario no tiene ese rol.",

        ephemeral: true

      });
    }

    await member.roles.remove(
      role.id
    );

    await interaction.reply({

      content:
        "Rol removido.",

      ephemeral: true

    });

    await interaction.channel.send({

      embeds: [

        new EmbedBuilder()

          .setTitle(
            "Rol removido"
          )

          .setDescription(
            `Se removió ${role} a ${member.user.tag}.`
          )

          .setColor(
            0xED4245
          )

      ]

    });
  }
}

module.exports = {
  command,
  execute
};

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const Database =
  require("better-sqlite3");

const db =
  new Database("db.db");

// =========================
// TABLE
// =========================

db.exec(`

CREATE TABLE IF NOT EXISTS permissions (
  userId TEXT PRIMARY KEY
);

`);

// =========================
// COMMAND
// =========================

const command =

  new SlashCommandBuilder()

    .setName("permission")

    .setDescription(
      "Gestiona permisos del bot"
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    // =====================
    // ADD
    // =====================

    .addSubcommand(sub =>

      sub

        .setName("add")

        .setDescription(
          "Da acceso a un usuario"
        )

        .addUserOption(option =>

          option

            .setName("usuario")

            .setDescription(
              "Usuario"
            )

            .setRequired(true)
        )
    )

    // =====================
    // REMOVE
    // =====================

    .addSubcommand(sub =>

      sub

        .setName("remove")

        .setDescription(
          "Quita acceso a un usuario"
        )

        .addUserOption(option =>

          option

            .setName("usuario")

            .setDescription(
              "Usuario"
            )

            .setRequired(true)
        )
    )

    // =====================
    // LIST
    // =====================

    .addSubcommand(sub =>

      sub

        .setName("list")

        .setDescription(
          "Muestra usuarios autorizados"
        )
    );

// =========================
// EXECUTE
// =========================

async function execute(
  interaction
) {

  const sub =
    interaction.options.getSubcommand();

  // =====================
  // ADD
  // =====================

  if (sub === "add") {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      INSERT OR REPLACE INTO permissions (
        userId
      )
      VALUES (?)
    `).run(user.id);

    const embed =

      new EmbedBuilder()

        .setTitle(
          "Permiso agregado"
        )

        .setDescription(
          `${user.tag} ahora puede usar el bot.`
        )

        .setColor(
          0x57F287
        );

    return interaction.reply({

      embeds: [embed],

      ephemeral: true

    });
  }

  // =====================
  // REMOVE
  // =====================

  if (sub === "remove") {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      DELETE FROM permissions
      WHERE userId = ?
    `).run(user.id);

    const embed =

      new EmbedBuilder()

        .setTitle(
          "Permiso removido"
        )

        .setDescription(
          `${user.tag} ya no puede usar el bot.`
        )

        .setColor(
          0xED4245
        );

    return interaction.reply({

      embeds: [embed],

      ephemeral: true

    });
  }

  // =====================
  // LIST
  // =====================

  if (sub === "list") {

    const rows =
      db.prepare(`
        SELECT *
        FROM permissions
      `).all();

    if (!rows.length) {

      return interaction.reply({

        content:
          "No hay usuarios autorizados.",

        ephemeral: true
      });
    }

    let users = "";

    for (const row of rows) {

      users +=
        `<@${row.userId}>\n`;
    }

    const embed =

      new EmbedBuilder()

        .setTitle(
          "Usuarios autorizados"
        )

        .setDescription(
          users
        )

        .setColor(
          0x5865F2
        );

    return interaction.reply({

      embeds: [embed],

      ephemeral: true

    });
  }
}

// =========================
// EXPORT
// =========================

module.exports = {
  command,
  execute
};

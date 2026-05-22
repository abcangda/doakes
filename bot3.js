const {
  SlashCommandBuilder
} = require("discord.js");

const Database =
  require("better-sqlite3");

const db =
  new Database("db.db");

const OWNER_ID =
  "1305030009681088592";

db.exec(`
CREATE TABLE IF NOT EXISTS permissions (
  userId TEXT PRIMARY KEY
);
`);

function hasAccess(userId) {

  if (userId === OWNER_ID)
    return true;

  return !!db.prepare(`
    SELECT * FROM permissions
    WHERE userId = ?
  `).get(userId);
}

const command =
  new SlashCommandBuilder()

    .setName("access")

    .setDescription(
      "Gestiona permisos"
    )

    .addSubcommand(sub =>
      sub
        .setName("grant")
        .setDescription("Dar acceso")
        .addUserOption(option =>
          option
            .setName("usuario")
            .setDescription("Usuario")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("revoke")
        .setDescription("Quitar acceso")
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
        .setDescription("Lista accesos")
    );

async function execute(interaction) {

  if (
    interaction.user.id !== OWNER_ID
  ) {

    return interaction.reply({

      content:"No autorizado.",

      ephemeral:true
    });
  }

  const sub =
    interaction.options.getSubcommand();

  if (sub === "grant") {

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
      content:`${user.tag} autorizado.`,
      ephemeral:true
    });
  }

  if (sub === "revoke") {

    const user =
      interaction.options.getUser(
        "usuario"
      );

    db.prepare(`
      DELETE FROM permissions
      WHERE userId = ?
    `).run(user.id);

    return interaction.reply({
      content:`${user.tag} removido.`,
      ephemeral:true
    });
  }

  if (sub === "list") {

    const rows =
      db.prepare(`
        SELECT * FROM permissions
      `).all();

    return interaction.reply({

      content:

        rows.map(
          x=>`<@${x.userId}>`
        ).join("\n")

        ||

        "Sin usuarios.",

      ephemeral:true
    });
  }
}

module.exports = {
  command,
  execute,
  hasAccess
};

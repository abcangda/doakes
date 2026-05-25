const {
  SlashCommandBuilder
} = require("discord.js");

const Database =
require("better-sqlite3");

const db =
new Database("db.db");

const OWNER_IDS = [
  "1305030009681088592",
  "1400202137903960146"
];

db.exec(`

CREATE TABLE IF NOT EXISTS mod_access (
  userId TEXT PRIMARY KEY
);

`);

function isOwner(id) {
  return OWNER_IDS.includes(id);
}

function hasMod(id) {

  if (isOwner(id))
    return true;

  return !!db.prepare(`
    SELECT * FROM mod_access
    WHERE userId = ?
  `).get(id);
}

const command =
new SlashCommandBuilder()

.setName("access")

.setDescription("Sistema access")

.addSubcommand(sub =>
  sub
  .setName("grant")
  .setDescription("Dar acceso")
  .addStringOption(option =>
    option
    .setName("id")
    .setDescription("ID")
    .setRequired(true)
  )
)

.addSubcommand(sub =>
  sub
  .setName("revoke")
  .setDescription("Quitar acceso")
  .addStringOption(option =>
    option
    .setName("id")
    .setDescription("ID")
    .setRequired(true)
  )
)

.addSubcommand(sub =>
  sub
  .setName("list")
  .setDescription("Ver lista")
);

async function execute(interaction) {

  if (!isOwner(interaction.user.id)) {

    return interaction.reply({
      content:"Acceso denegado.",
      ephemeral:true
    });
  }

  const sub =
  interaction.options.getSubcommand();

  if (sub === "grant") {

    const id =
    interaction.options.getString("id");

    db.prepare(`
      INSERT OR REPLACE INTO
      mod_access (userId)
      VALUES (?)
    `).run(id);

    return interaction.reply({
      content:`${id} autorizado.`,
      ephemeral:true
    });
  }

  if (sub === "revoke") {

    const id =
    interaction.options.getString("id");

    db.prepare(`
      DELETE FROM mod_access
      WHERE userId = ?
    `).run(id);

    return interaction.reply({
      content:`${id} removido.`,
      ephemeral:true
    });
  }

  if (sub === "list") {

    const rows =
    db.prepare(`
      SELECT * FROM mod_access
    `).all();

    return interaction.reply({

      content:

      rows.map(x=>x.userId)
      .join("\n")

      ||

      "Sin usuarios.",

      ephemeral:true
    });
  }
}

module.exports = {
  command,
  execute,
  hasMod,
  isOwner
};

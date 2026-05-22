const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const Database = require("better-sqlite3");

const db = new Database("db.db");

const OWNER_ID =
  "1305030009681088592";

db.exec(`
CREATE TABLE IF NOT EXISTS permissions (
  userId TEXT PRIMARY KEY
);
`);

const command =
  new SlashCommandBuilder()

    .setName("access")

    .setDescription(
      "Gestiona accesos"
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addSubcommand(sub =>
      sub
        .setName("grant")
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
        .setName("revoke")
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
        .setDescription("Lista accesos")
    )

    .addSubcommand(sub =>
      sub
        .setName("addrole")
        .setDescription("Agrega rol")
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
    )

    .addSubcommand(sub =>
      sub
        .setName("removerole")
        .setDescription("Quita rol")
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

async function execute(interaction) {

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
      embeds: [
        new EmbedBuilder()
          .setColor(0x0A0A0A)
          .setTitle("ACCESS GRANTED")
          .setDescription(
            `${user.tag} recibió acceso.`
          )
      ]
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
      embeds: [
        new EmbedBuilder()
          .setColor(0x0A0A0A)
          .setTitle("ACCESS REVOKED")
          .setDescription(
            `${user.tag} perdió acceso.`
          )
      ]
    });
  }

  if (sub === "list") {

    const rows =
      db.prepare(`
        SELECT * FROM permissions
      `).all();

    const text =
      rows.map(x=>`<@${x.userId}>`)
      .join("\n")
      ||
      "Sin usuarios.";

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x0A0A0A)
          .setTitle("AUTHORIZED USERS")
          .setDescription(text)
      ]
    });
  }

  if (
    interaction.user.id !== OWNER_ID
  ) {

    return interaction.reply({
      content: "No autorizado.",
      ephemeral: true
    });
  }

  const member =
    interaction.options.getMember(
      "usuario"
    );

  const role =
    interaction.options.getRole(
      "rol"
    );

  if (sub === "addrole") {

    await member.roles.add(role.id);

    await interaction.reply({
      content: "Rol agregado.",
      ephemeral: true
    });

    return interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x0A0A0A)
          .setTitle("ROLE ADDED")
          .setDescription(
            `${role} fue agregado a ${member.user.tag}.`
          )
      ]
    });
  }

  if (sub === "removerole") {

    await member.roles.remove(role.id);

    await interaction.reply({
      content: "Rol removido.",
      ephemeral: true
    });

    return interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x0A0A0A)
          .setTitle("ROLE REMOVED")
          .setDescription(
            `${role} fue removido de ${member.user.tag}.`
          )
      ]
    });
  }
}

module.exports = {
  command,
  execute
};

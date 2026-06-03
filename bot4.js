module.exports = (client, db, saveDB, getUser) => {
  const OWNER_ID = process.env.OWNER_ID;

  function logModeration(data) {
    if (!db.logs.moderation) db.logs.moderation = [];
    db.logs.moderation.push({ ...data, date: Date.now() });
    saveDB(db);
  }

  function isStaff(member) {
    return member.permissions.has("ModerateMembers") || member.permissions.has("Administrator");
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member, user, guild } = interaction;

    const target = options.getUser("user");
    const reason = options.getString("reason") || "Sin razón";

    if (!isStaff(member) && user.id !== OWNER_ID) {
      return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
    }

    /* ================= BAN ================= */
    if (commandName === "ban") {
      const memberTarget = await guild.members.fetch(target.id).catch(() => null);
      if (!memberTarget) return interaction.reply("Usuario no encontrado.");

      await memberTarget.ban({ reason });

      logModeration({ type: "BAN", user: target.id, by: user.id, reason });

      return interaction.reply(`🔨 Usuario baneado: ${target.tag}`);
    }

    /* ================= KICK ================= */
    if (commandName === "kick") {
      const memberTarget = await guild.members.fetch(target.id).catch(() => null);
      if (!memberTarget) return interaction.reply("Usuario no encontrado.");

      await memberTarget.kick(reason);

      logModeration({ type: "KICK", user: target.id, by: user.id, reason });

      return interaction.reply(`👢 Usuario expulsado: ${target.tag}`);
    }

    /* ================= MUTE ================= */
    if (commandName === "mute") {
      const memberTarget = await guild.members.fetch(target.id).catch(() => null);
      if (!memberTarget) return interaction.reply("Usuario no encontrado.");

      await memberTarget.timeout(10 * 60 * 1000, reason);

      logModeration({ type: "MUTE", user: target.id, by: user.id, reason });

      return interaction.reply(`🔇 Usuario muteado: ${target.tag}`);
    }

    /* ================= UNMUTE ================= */
    if (commandName === "unmute") {
      const memberTarget = await guild.members.fetch(target.id).catch(() => null);
      if (!memberTarget) return interaction.reply("Usuario no encontrado.");

      await memberTarget.timeout(null);

      logModeration({ type: "UNMUTE", user: target.id, by: user.id });

      return interaction.reply(`🔊 Usuario desmuteado: ${target.tag}`);
    }

    /* ================= LASER ================= */
    if (commandName === "laser") {
      const memberTarget = await guild.members.fetch(target.id).catch(() => null);
      if (!memberTarget) return interaction.reply("Usuario no encontrado.");

      await memberTarget.ban({ reason: "LASER EXECUTION" });

      logModeration({ type: "LASER", user: target.id, by: user.id });

      return interaction.reply(`💀 LASER ACTIVADO: ${target.tag} eliminado del sistema.`);
    }
  });
};

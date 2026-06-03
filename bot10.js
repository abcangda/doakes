module.exports = (client, db, saveDB, getUser) => {

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, user } = interaction;
    const u = getUser(user.id);

    /* ================= MARRY ================= */
    if (commandName === "marry") {
      const target = options.getUser("user");

      db.marriages[user.id] = target.id;

      return interaction.reply(`💍 ${user.username} se casó con ${target.username}`);
    }

    /* ================= DIVORCE ================= */
    if (commandName === "divorce") {
      delete db.marriages[user.id];

      return interaction.reply(`💔 Divorcio realizado.`);
    }

    /* ================= REP ================= */
    if (commandName === "rep") {
      u.reputation += 1;

      return interaction.reply(`⭐ Reputación aumentada: ${u.reputation}`);
    }

    /* ================= EVENT ================= */
    if (commandName === "event") {
      return interaction.reply("🎉 Evento activo en desarrollo.");
    }

    /* ================= HUNT ================= */
    if (commandName === "hunt") {
      const reward = Math.floor(Math.random() * 1000);

      u.coins += reward;

      return interaction.reply(`🏹 Caza completada +${reward} TC`);
    }
  });
};

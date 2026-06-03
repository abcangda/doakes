module.exports = (client, db, saveDB, getUser) => {
  const OWNER_ID = process.env.OWNER_ID;

  function isOwner(id) {
    return id === OWNER_ID;
  }

  function logEcho(action, data) {
    if (!db.echo.logs) db.echo.logs = [];
    db.echo.logs.push({
      action,
      data,
      date: Date.now()
    });
    saveDB(db);
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    /* =========================
       /echo
    ========================= */
    if (commandName === "echo") {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({ content: "❌ No autorizado.", ephemeral: true });
      }

      const text = interaction.options.getString("text");

      logEcho("ECHO_USED", { user: interaction.user.id, text });

      return interaction.reply({
        content: `📡 ECHO: ${text}`,
        ephemeral: false
      });
    }

    /* =========================
       /echo add
    ========================= */
    if (commandName === "echo_add") {
      if (!isOwner(interaction.user.id)) return;

      const user = interaction.options.getUser("user");

      if (!db.echo.authorized.includes(user.id)) {
        db.echo.authorized.push(user.id);
        saveDB(db);
      }

      logEcho("ECHO_ADD", { user: user.id });

      return interaction.reply(`✅ Usuario agregado a Echo: ${user.tag}`);
    }

    /* =========================
       /echo remove
    ========================= */
    if (commandName === "echo_remove") {
      if (!isOwner(interaction.user.id)) return;

      const user = interaction.options.getUser("user");

      db.echo.authorized = db.echo.authorized.filter(u => u !== user.id);
      saveDB(db);

      logEcho("ECHO_REMOVE", { user: user.id });

      return interaction.reply(`❌ Usuario removido de Echo: ${user.tag}`);
    }

    /* =========================
       /echo revoke
    ========================= */
    if (commandName === "echo_revoke") {
      if (!isOwner(interaction.user.id)) return;

      db.echo.authorized = [];
      saveDB(db);

      logEcho("ECHO_REVOKE", { by: interaction.user.id });

      return interaction.reply("🚫 Todo el acceso Echo ha sido revocado.");
    }

    /* =========================
       /echo list
    ========================= */
    if (commandName === "echo_list") {
      if (!isOwner(interaction.user.id)) return;

      const list = db.echo.authorized
        .map(id => `<@${id}>`)
        .join("\n") || "Vacío";

      return interaction.reply({
        content: `📡 Echo Authorized Users:\n${list}`,
        ephemeral: true
      });
    }

    /* =========================
       /echo theseven
    ========================= */
    if (commandName === "echo_theseven") {
      if (!isOwner(interaction.user.id)) return;

      const sevenRole = "1507504946088513536";
      const guild = interaction.guild;

      const members = await guild.members.fetch();

      let added = 0;

      members.forEach(m => {
        if (m.roles.cache.has(sevenRole)) {
          if (!db.echo.authorized.includes(m.id)) {
            db.echo.authorized.push(m.id);
            added++;
          }
        }
      });

      saveDB(db);

      logEcho("ECHO_THE_SEVEN", { added });

      return interaction.reply(`👑 Echo autorizado a The Seven: ${added} usuarios`);
    }
  });
};

module.exports = (client, db, saveDB, getUser) => {
  const OWNER_ID = process.env.OWNER_ID;

  function isOwner(id) {
    return id === OWNER_ID;
  }

  function log(action, data) {
    if (!db.logs.owner) db.logs.owner = [];
    db.logs.owner.push({
      action,
      data,
      date: Date.now()
    });
    saveDB(db);
  }

  client.on("interactionCreate", (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: "❌ No autorizado.", ephemeral: true });
    }

    const { commandName } = interaction;

    /* =========================
       /owner coins
    ========================= */
    if (commandName === "owner_coins") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      const u = getUser(user.id);
      u.coins += amount;

      log("COINS_ADD", { user: user.id, amount });

      return interaction.reply(`💰 ${amount} coins añadidas a ${user.tag}`);
    }

    /* =========================
       /owner xp
    ========================= */
    if (commandName === "owner_xp") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      const u = getUser(user.id);
      u.xp += amount;

      log("XP_ADD", { user: user.id, amount });

      return interaction.reply(`📈 ${amount} XP añadida a ${user.tag}`);
    }

    /* =========================
       /owner prestige
    ========================= */
    if (commandName === "owner_prestige") {
      const user = interaction.options.getUser("user");

      const u = getUser(user.id);
      u.prestige += 1;

      log("PRESTIGE_ADD", { user: user.id });

      return interaction.reply(`👑 Prestige aumentado para ${user.tag}`);
    }

    /* =========================
       /owner reset
    ========================= */
    if (commandName === "owner_reset") {
      db.users = {};
      saveDB(db);

      log("RESET_ALL", { by: interaction.user.id });

      return interaction.reply("⚠️ Base de datos reiniciada.");
    }

    /* =========================
       /owner stock
    ========================= */
    if (commandName === "owner_stock") {
      const item = interaction.options.getString("item");
      const amount = interaction.options.getInteger("amount");

      if (!db.shop[item]) db.shop[item] = { stock: 0 };

      db.shop[item].stock = amount;
      saveDB(db);

      log("STOCK_SET", { item, amount });

      return interaction.reply(`📦 Stock actualizado: ${item} = ${amount}`);
    }
  });
};

module.exports = (client, db, saveDB, getUser) => {

  function logEconomy(data) {
    if (!db.logs.economy) db.logs.economy = [];
    db.logs.economy.push({ ...data, date: Date.now() });
    saveDB(db);
  }

  function getBalance(id) {
    return getUser(id).coins;
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, user } = interaction;

    const u = getUser(user.id);

    /* ================= BALANCE ================= */
    if (commandName === "balance") {
      return interaction.reply(`💰 Balance: **${u.coins} TC**`);
    }

    /* ================= PAY ================= */
    if (commandName === "pay") {
      const target = options.getUser("user");
      const amount = options.getInteger("amount");

      if (u.coins < amount) {
        return interaction.reply("❌ No tienes suficiente dinero.");
      }

      u.coins -= amount;
      getUser(target.id).coins += amount;

      logEconomy({ type: "PAY", from: user.id, to: target.id, amount });

      return interaction.reply(`💸 Enviado ${amount} TC a ${target.tag}`);
    }

    /* ================= COINFLIP ================= */
    if (commandName === "coinflip") {
      const bet = options.getInteger("amount");

      if (u.coins < bet) return interaction.reply("❌ No tienes dinero.");

      const win = Math.random() < 0.5;

      if (win) {
        u.coins += bet;
        logEconomy({ type: "COINFLIP_WIN", user: user.id, amount: bet });
        return interaction.reply(`🪙 Ganaste ${bet} TC`);
      } else {
        u.coins -= bet;
        logEconomy({ type: "COINFLIP_LOSE", user: user.id, amount: bet });
        return interaction.reply(`💀 Perdiste ${bet} TC`);
      }
    }

    /* ================= ROB ================= */
    if (commandName === "rob") {
      const target = options.getUser("user");
      const targetUser = getUser(target.id);

      const steal = Math.floor(targetUser.coins * 0.1);

      if (steal <= 0) return interaction.reply("Nada que robar.");

      targetUser.coins -= steal;
      u.coins += steal;

      logEconomy({ type: "ROB", from: user.id, to: target.id, amount: steal });

      return interaction.reply(`🦹 Robaste ${steal} TC a ${target.tag}`);
    }

    /* ================= JACKPOT ================= */
    if (commandName === "jackpot") {
      const bet = options.getInteger("amount");

      if (u.coins < bet) return interaction.reply("❌ Sin dinero.");

      const win = Math.random() < 0.15;

      if (win) {
        const reward = bet * 5;
        u.coins += reward;
        return interaction.reply(`🎰 JACKPOT! Ganaste ${reward} TC`);
      } else {
        u.coins -= bet;
        return interaction.reply(`💀 Perdiste todo.`);
      }
    }
  });
};

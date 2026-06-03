module.exports = (client, db, saveDB, getUser) => {

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, user } = interaction;
    const u = getUser(user.id);

    /* ================= PROFILE ================= */
    if (commandName === "profile") {
      const target = options.getUser("user") || user;
      const data = getUser(target.id);

      return interaction.reply(
`👤 PROFILE — ${target.tag}

💰 Coins: ${data.coins}
📈 XP: ${data.xp}
🎚️ Level: ${data.level}
👑 Prestige: ${data.prestige}
⭐ Reputation: ${data.reputation}
💬 Messages: ${data.messages}

🏟️ Team: ${data.team || "None"}
💍 Marriage: ${data.marriage || "None"}
`
      );
    }

    /* ================= COMPARE ================= */
    if (commandName === "compare") {
      const user1 = user;
      const user2 = options.getUser("user");

      const a = getUser(user1.id);
      const b = getUser(user2.id);

      return interaction.reply(
`⚔️ COMPARISON

${user1.tag} vs ${user2.tag}

Coins: ${a.coins} vs ${b.coins}
Level: ${a.level} vs ${b.level}
Reputation: ${a.reputation} vs ${b.reputation}
`
      );
    }

    /* ================= PRESTIGE ================= */
    if (commandName === "prestige") {
      if (u.level < 100) return interaction.reply("❌ Nivel insuficiente.");

      u.level = 1;
      u.xp = 0;
      u.prestige += 1;

      return interaction.reply("👑 Prestige aumentado.");
    }

    /* ================= ACHIEVEMENTS ================= */
    if (commandName === "achievements") {
      return interaction.reply("🏆 Sistema en desarrollo.");
    }

    /* ================= BADGES ================= */
    if (commandName === "badges") {
      return interaction.reply("🎖️ Sistema en desarrollo.");
    }

    /* ================= INTEL ================= */
    if (commandName === "intel") {
      const target = options.getUser("user");
      const t = getUser(target.id);

      return interaction.reply(
`🧠 INTEL REPORT

User: ${target.tag}
Risk Level: ${t.reputation > 50 ? "HIGH" : "LOW"}
Economy Status: ${t.coins}
Activity: ${t.messages}`
      );
    }

    /* ================= SCAN ================= */
    if (commandName === "scan") {
      return interaction.reply("🔍 Scan complete. No anomalies detected.");
    }

    /* ================= FILE ================= */
    if (commandName === "file") {
      return interaction.reply("📁 Classified file system not implemented yet.");
    }
  });
};

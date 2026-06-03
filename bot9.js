module.exports = (client, db, saveDB, getUser) => {

  function getWar(id) {
    if (!db.wars[id]) {
      db.wars[id] = {
        teamA: null,
        teamB: null,
        pointsA: 0,
        pointsB: 0,
        active: false
      };
    }
    return db.wars[id];
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    /* ================= DECLARE ================= */
    if (commandName === "war_declare") {
      const a = options.getString("teamA");
      const b = options.getString("teamB");

      const id = Date.now().toString();

      db.wars[id] = {
        teamA: a,
        teamB: b,
        pointsA: 0,
        pointsB: 0,
        active: true
      };

      return interaction.reply(`⚔️ Guerra iniciada: ${a} vs ${b}`);
    }

    /* ================= INFO ================= */
    if (commandName === "war_info") {
      const id = options.getString("id");
      const w = db.wars[id];

      if (!w) return interaction.reply("No existe.");

      return interaction.reply(
`⚔️ WAR

${w.teamA} (${w.pointsA})
vs
${w.teamB} (${w.pointsB})`
      );
    }

    /* ================= ACCEPT / DENY ================= */
    if (commandName === "war_accept") {
      return interaction.reply("✅ Guerra aceptada.");
    }

    if (commandName === "war_deny") {
      return interaction.reply("❌ Guerra rechazada.");
    }

    /* ================= HISTORY ================= */
    if (commandName === "war_history") {
      return interaction.reply("📜 Historial de guerras guardado en DB.");
    }
  });
};

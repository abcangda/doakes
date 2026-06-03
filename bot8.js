module.exports = (client, db, saveDB, getUser) => {

  function getTeam(id) {
    if (!db.teams[id]) {
      db.teams[id] = {
        members: [],
        level: 1,
        xp: 0,
        owner: null,
        rivals: [],
        allies: []
      };
    }
    return db.teams[id];
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, user } = interaction;

    /* ================= CREATE ================= */
    if (commandName === "team_create") {
      const name = options.getString("name");

      db.teams[name] = {
        owner: user.id,
        members: [user.id],
        level: 1,
        xp: 0,
        rivals: [],
        allies: []
      };

      return interaction.reply(`🏟️ Equipo creado: ${name}`);
    }

    /* ================= JOIN ================= */
    if (commandName === "team_join") {
      const name = options.getString("name");
      const team = db.teams[name];

      if (!team) return interaction.reply("❌ No existe.");

      if (team.members.includes(user.id))
        return interaction.reply("Ya estás dentro.");

      team.members.push(user.id);

      return interaction.reply(`✅ Entraste a ${name}`);
    }

    /* ================= LEAVE ================= */
    if (commandName === "team_leave") {
      for (let t in db.teams) {
        db.teams[t].members = db.teams[t].members.filter(m => m !== user.id);
      }

      return interaction.reply("🚪 Saliste del equipo.");
    }

    /* ================= INFO ================= */
    if (commandName === "team_info") {
      const name = options.getString("name");
      const t = db.teams[name];

      if (!t) return interaction.reply("❌ No existe.");

      return interaction.reply(
`🏟️ TEAM: ${name}

Owner: ${t.owner}
Members: ${t.members.length}
Level: ${t.level}
`
      );
    }

    /* ================= UPGRADE ================= */
    if (commandName === "team_upgrade") {
      const name = options.getString("name");
      const t = db.teams[name];

      t.level++;

      return interaction.reply(`⬆️ Equipo mejorado: ${name}`);
    }

    /* ================= RIVAL ================= */
    if (commandName === "team_rival") {
      const a = options.getString("team1");
      const b = options.getString("team2");

      db.teams[a].rivals.push(b);

      return interaction.reply(`⚔️ Rivalidad creada`);
    }

    /* ================= ALLIANCE ================= */
    if (commandName === "team_alliance") {
      const a = options.getString("team1");
      const b = options.getString("team2");

      db.teams[a].allies.push(b);

      return interaction.reply(`🤝 Alianza creada`);
    }
  });
};

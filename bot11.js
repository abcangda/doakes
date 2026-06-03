module.exports = (client, db, saveDB, getUser) => {

  /* =========================
     UTILIDADES
  ========================= */

  const cooldown = new Map();

  const isSpam = (id) => {
    const now = Date.now();
    const last = cooldown.get(id) || 0;

    if (now - last < 1200) return true;

    cooldown.set(id, now);
    return false;
  };

  const ensureMission = (u) => {
    if (!u.mission) {
      u.mission = {
        type: "chat",
        progress: 0,
        goal: 25,
        reward: 500
      };
    }
  };

  const levelUp = (u) => {
    const req = u.level * 120;

    if (u.xp >= req) {
      u.level++;
      u.xp = 0;
      u.coins += 1000;

      if (u.level % 10 === 0) {
        u.coins += 5000;
      }
    }
  };

  /* =========================
     ACTIVIDAD GLOBAL (UN SOLO EVENTO)
  ========================= */

  client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    const u = getUser(message.author.id);

    if (message.content.length < 3) return;
    if (isSpam(message.author.id)) return;

    u.messages += 1;
    u.xp += 12;
    u.coins += 6;

    levelUp(u);
    ensureMission(u);

    /* =========================
       MISIÓN
    ========================= */

    u.mission.progress++;

    if (u.mission.progress >= u.mission.goal) {
      u.coins += u.mission.reward;
      u.xp += 50;

      u.mission = {
        type: "chat",
        progress: 0,
        goal: 20 + Math.floor(Math.random() * 30),
        reward: 500 + Math.floor(Math.random() * 1500)
      };
    }

    /* =========================
       GUERRAS ACTIVAS
    ========================= */

    for (const id in db.wars) {
      const war = db.wars[id];
      if (!war.active) continue;

      if (u.team === war.teamA) war.pointsA++;
      if (u.team === war.teamB) war.pointsB++;
    }

    /* =========================
       EVENTOS
    ========================= */

    if (db.events?.active) {
      const e = db.events.active;

      if (Date.now() < e.ends) {
        if (e.type === "xp_boost") u.xp += 5;
        if (e.type === "coins_boost") u.coins += 5;
        if (e.type === "hunt_event") u.coins += Math.floor(Math.random() * 10);
      }
    }

    saveDB();
  });

  /* =========================
     VOICE SYSTEM
  ========================= */

  const voice = new Map();

  client.on("voiceStateUpdate", (oldState, newState) => {
    const id = newState.member?.id;
    if (!id || newState.member.user.bot) return;

    const u = getUser(id);

    if (!oldState.channel && newState.channel) {
      voice.set(id, Date.now());
    }

    if (oldState.channel && !newState.channel) {
      const start = voice.get(id);
      if (!start) return;

      const minutes = Math.floor((Date.now() - start) / 60000);

      if (minutes > 1) {
        u.voice += minutes;
        u.xp += minutes * 6;
        u.coins += minutes * 12;
      }

      voice.delete(id);
      saveDB();
    }
  });

  /* =========================
     PANEL HOMELANDER (/homelander)
  ========================= */

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "homelander") return;

    const users = Object.values(db.users || {});

    const richest = users.reduce((a, b) => (a.coins > b.coins ? a : b), {});
    const topLevel = users.reduce((a, b) => (a.level > b.level ? a : b), {});
    const topRep = users.reduce((a, b) => (a.reputation > b.reputation ? a : b), {});

    const totalCoins = users.reduce((a, b) => a + (b.coins || 0), 0);
    const totalXP = users.reduce((a, b) => a + (b.xp || 0), 0);
    const totalMsg = users.reduce((a, b) => a + (b.messages || 0), 0);

    return interaction.reply({
      embeds: [
        {
          color: 0x111111,
          title: "🧠 HOMELANDER CONTROL PANEL",
          description: "Texaz Core System Status",
          fields: [
            { name: "💰 Economía", value: `${totalCoins} TC`, inline: true },
            { name: "📈 XP Global", value: `${totalXP}`, inline: true },
            { name: "💬 Mensajes", value: `${totalMsg}`, inline: true },

            { name: "👑 Más rico", value: `<@${richest.id}>`, inline: false },
            { name: "🏆 Nivel más alto", value: `<@${topLevel.id}>`, inline: false },
            { name: "⭐ Reputación top", value: `<@${topRep.id}>`, inline: false }
          ],
          footer: { text: "Homelander System • Texaz Core" }
        }
      ]
    });
  });

  console.log("Homelander Core loaded");
};

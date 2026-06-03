const SHOP = {
  "title_change": 15000,
  "profile_color": 20000,
  "private_profile": 250000,
  "team_slot": 500000,
  "xp_boost": 4000,
  "coins_boost": 5000,
  "nitro": 5000000,
  "nitro_basic": 3500000,
  "robux_80": 2500000,
  "deco": 4000000
};

module.exports = (client, db, saveDB, getUser) => {

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, user } = interaction;

    const u = getUser(user.id);

    /* ================= SHOP ================= */
    if (commandName === "shop") {
      return interaction.reply({
        content:
`🛒 TIENDA HOMELANDER

⚡ BOOSTS
XP 1h → 4,000 TC
XP 24h → 25,000 TC
Coins 1h → 5,000 TC
Coins 24h → 30,000 TC

🎭 PERSONALIZACIÓN
Título → 15,000 TC
Color → 20,000 TC
Perfil privado → 250,000 TC

💰 FINANZAS
Préstamo extra → 50,000 TC

🏟️ EQUIPOS
Crear equipo → 5,000 TC
+1 miembro → 500,000 TC

👑 PREMIUM
Rol personalizado → 800,000 TC
Rol equipo → 1,200,000 TC
Nitro → 5,000,000 TC`
      });
    }

    /* ================= BUY ================= */
    if (commandName === "buy") {
      const item = options.getString("item");

      if (!SHOP[item]) return interaction.reply("❌ Item inválido.");

      const price = SHOP[item];

      if (u.coins < price) return interaction.reply("❌ No tienes dinero.");

      u.coins -= price;

      if (!db.inventory[user.id]) db.inventory[user.id] = [];
      db.inventory[user.id].push(item);

      saveDB(db);

      return interaction.reply(`🛍️ Compraste: ${item}`);
    }

    /* ================= INVENTORY ================= */
    if (commandName === "inventory") {
      const inv = db.inventory[user.id] || [];

      return interaction.reply(
        inv.length ? `🎒 Inventario:\n${inv.join("\n")}` : "Vacío"
      );
    }
  });
};

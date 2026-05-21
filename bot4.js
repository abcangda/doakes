const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const OWNER_IDS = [

  "1305030009681088592",

  "1400202137903960146"

];

const command =
  new SlashCommandBuilder()

    .setName("ban")

    .setDescription(
      "Banea un usuario"
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    );

async function execute(
  interaction
) {

  if (
    !OWNER_IDS.includes(
      interaction.user.id
    )
  ) {

    return interaction.reply({

      content:
        "No puedes usar este comando.",

      ephemeral: true

    });
  }

  const user =
    interaction.options.getUser(
      "usuario"
    );

  const reason =
    interaction.options.getString(
      "razon"
    ) || "Sin razón.";

  const member =
    interaction.guild.members.cache.get(
      user.id
    );

  if (!member) {

    return interaction.reply({

      content:
        "Usuario no encontrado.",

      ephemeral: true

    });
  }

  await member.ban({
    reason
  });

  await interaction.reply({

    content:
      "Usuario baneado.",

    ephemeral: true

  });

  await interaction.channel.send({

    embeds: [

      new EmbedBuilder()

        .setTitle(
          "Sistema de moderación"
        )

        .setDescription(
          `Homelander asesinó a ${user.tag}.`
        )

        .addFields({

          name: "Razón",

          value: reason

        })

        .setColor(
          0xED4245
        )

    ]

  });
}

module.exports = {
  command,
  execute
};

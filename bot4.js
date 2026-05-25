const {
  EmbedBuilder
} = require("discord.js");

const gifs = {

  danger:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1507467664933519440/image0.gif",

  success:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1507487015065878558/image0.gif",

  deny:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1507467086182613173/image0.gif",

  sad:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1507486803471503502/image0.gif",

  stronger:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1508297999359676507/image0.gif",

  milk:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1508297999644754070/image1.gif",

  disgust:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1508297999938359386/image2.gif",

  roof:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1508298000638677053/image3.gif",

  sarcastic:
  "https://cdn.discordapp.com/attachments/1494932411702710312/1508298001335058522/image4.gif"
};

function createEmbed(
  title,
  desc,
  gif = gifs.success
) {

  return new EmbedBuilder()

    .setColor(0x0A0A0A)

    .setTitle(title)

    .setDescription(desc)

    .setImage(gif)

    .setFooter({
      text:"Vought International"
    })

    .setTimestamp();
}

module.exports = {
  gifs,
  createEmbed
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sendembed')
    .setDescription('Verzendt of wijzigt een embed op basis van een JSON-bestand.')
    .addStringOption(option =>
      option.setName('filename')
        .setDescription('De naam van het JSON-bestand (zonder extensie)')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('kanaal')
        .setDescription('Het kanaal waarnaar de embed wordt gestuurd')
        .setRequired(true)),
  async run(client, interaction) {
    const filename = interaction.options.getString('filename');
    const channel = interaction.options.getChannel('kanaal');
    const filepath = path.join(__dirname, '..', 'assets', 'embeds', `${filename}.json`);

    console.log(`Bestandspad: ${filepath}`); // Debugging

    if (!fs.existsSync(filepath)) {
      await interaction.reply({ content: 'Het opgegeven bestand bestaat niet!', ephemeral: true });
      return;
    }

    // Laad de JSON-inhoud
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    console.log("JSON Data:", data); // Debugging

    // Controleer of de embeds array bestaat
    if (!data.embeds || !Array.isArray(data.embeds) || data.embeds.length === 0) {
      console.log("Fout: JSON bevat geen geldige embeds array.");
      await interaction.reply({ content: 'De JSON bevat geen geldige embeds!', ephemeral: true });
      return;
    }

    // Bouw embeds
    const embeds = [];
    for (const embedData of data.embeds) {
      const embed = new EmbedBuilder();

      if (embedData.title) {
        embed.setTitle(embedData.title);
      }
      if (embedData.description) {
        embed.setDescription(embedData.description);
      }
      if (embedData.color) {
        embed.setColor(embedData.color);
      }
      if (embedData.thumbnail) {
        embed.setThumbnail(embedData.thumbnail);
      }
      if (embedData.image) {
        embed.setImage(embedData.image);
      }
      if (embedData.fields) {
        embedData.fields.forEach(field => {
          embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
        });
      }
      if (embedData.author) {
        embed.setAuthor({
          name: embedData.author.name,
          iconURL: embedData.author.icon_url || null,
          url: embedData.author.url || null
        });
      }

      embeds.push(embed);
    }

    if (data.messageId) {
      // Bewerk het bestaande bericht
      try {
        const message = await channel.messages.fetch(data.messageId); // Fetch het bericht met de ID
        await message.edit({ embeds: embeds }); // Bewerk het bericht
        await interaction.reply({ content: 'Embed succesvol aangepast!', ephemeral: true });
      } catch (error) {
        console.error("Fout bij het bewerken van het bericht:", error);
        await interaction.reply({ content: 'Fout bij het aanpassen van het bericht. Controleer of de messageId correct is.', ephemeral: true });
      }
    } else {
      // Stuur een nieuw bericht en sla de messageId op
      try {
        const sentMessage = await channel.send({ embeds: embeds }); // Stuur het nieuwe bericht

        // Bewaar de nieuwe messageId in het JSON-bestand
        data.messageId = sentMessage.id;

        // Schrijf de bijgewerkte JSON terug naar het bestand
        fs.writeFileSync(filepath, JSON.stringify(data, null, 4));
        console.log(`messageId opgeslagen in JSON: ${sentMessage.id}`);

        await interaction.reply({ content: 'Embed succesvol verzonden en messageId opgeslagen!', ephemeral: true });
      } catch (error) {
        console.error("Fout bij het verzenden van het bericht:", error);
        await interaction.reply({ content: 'Fout bij het verzenden van de embed.', ephemeral: true });
      }
    }
  }
};

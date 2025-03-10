const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
require('dotenv').config();

// Laad de config uit je .env bestand
const clientId = process.env.CLIENT_ID;
const token = process.env.BOTTOKEN;
const guildIds = process.env.GUILD_IDS.split(',');  // GUILD_IDS = "guildId1,guildId2" in je .env

const commands = [];

// Laad alle slash commands uit de 'commands'-map
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./src/commands/${file}`);
    if (command.data) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Voor elke guild de commands registreren
        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            console.log(`Successfully reloaded application (/) commands for guild ${guildId}.`);
        }
    } catch (error) {
        console.error(error);
    }
})();

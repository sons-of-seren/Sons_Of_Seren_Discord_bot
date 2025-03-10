const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    // Initialiseer de commands Map
    client.commands = new Map();

    // Laad alle slash commands
    const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(__dirname, '..', 'commands', file));
        if (command.data) {
            client.commands.set(command.data.name, command);
            console.log(`Command geladen: ${command.data.name}`);
        }
    }

    // Event listener voor interactionCreate
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.run(client, interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Er ging iets mis bij het uitvoeren van dit commando.', ephemeral: true });
        }
    });
};

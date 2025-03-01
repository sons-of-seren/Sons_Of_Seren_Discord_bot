require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

// Importeer en gebruik de modules
require('./modules/PingBot')(client);
require('./modules/SetRsn')(client);
require('./modules/LootLogSetup')(client);

client.login(process.env.TOKEN);

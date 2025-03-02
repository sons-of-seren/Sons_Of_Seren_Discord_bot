require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const mysql = require('mysql2');
const dbConfig = require('./config/dbConfig');
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

// Maak verbinding met de database
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('Fout bij het verbinden met de database:', err);
        return;
    }
    console.log('Verbonden met de database.');
});

// Laad de modules in
require('./modules/botReady')(client);
require('./modules/pingBot')(client);
require('./modules/setRsn')(client, connection);
require('./modules/lootLogSetup')(client, connection);

client.login(process.env.BOTTOKEN);

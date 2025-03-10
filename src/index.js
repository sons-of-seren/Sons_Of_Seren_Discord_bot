require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const mysql = require('mysql2');
const express = require('express');
const path = require('path');
const fs = require('fs');

const logger = require(path.join(__dirname, 'modules', 'logger'));

logger.info('Server wordt gestart...');



// Discord bot-instellingen
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});



// Express-server instellen
const app = express();
const personalDinkConfigsPath = path.join(__dirname, '..', '..', 'personalDinkConfigs');

app.use(express.static(personalDinkConfigsPath));
    logger.info(`Serving static files from: ${personalDinkConfigsPath}`);

app.get('/ping', (req, res) => {
    res.send('Server is running!');
});
// Middleware om aanvragen te loggen
app.use((req, res, next) => {
    logger.info(`Request ontvangen: ${req.method} ${req.url}`);
    next();
});
// Controleer of bestanden correct worden geserveerd
app.use((req, res, next) => {
    const filePath = path.join(personalDinkConfigsPath, req.url);
    if (fs.existsSync(filePath)) {
        logger.info(`Bestand bestaat: ${filePath}`);
    } else {
        logger.warn(`Bestand niet gevonden: ${filePath}`);
    }
    next();
});
// Start de Express-server
const PORT = 6157;
app.listen(PORT, () => {
    logger.info(`Server draait op port ${PORT}`);
});



// database laden
const dbConfig = require(path.join(__dirname, 'config', 'dbConfig'));
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        logger.error('Fout bij het verbinden met de database:', err);
        return;
    }
    logger.info('Verbonden met de database.');
});


// Modules laden voor de bot-functionaliteit
try {
    const modulesPath = path.join(__dirname, 'modules');
    require(path.join(modulesPath, 'slashCommands'))(client);
    require(path.join(modulesPath, 'botReady'))(client);
    require(path.join(modulesPath, 'pingBot'))(client);
    require(path.join(modulesPath, 'setRsn'))(client, connection);
    require(path.join(modulesPath, 'lootLogSetup'))(client, connection);
} catch (err) {
    logger.error('Fout bij het laden van een module:', err);
}


// Start de Discord bot
client.login(process.env.BOTTOKEN).then(() => {
    logger.info('Bot succesvol ingelogd.');
}).catch(err => {
    logger.error('Fout bij het inloggen van de bot:', err);
});

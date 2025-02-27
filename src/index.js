require('dotenv').config();
const fs = require('fs');
// Laad de JSON-gegevens
let rsnData = JSON.parse(fs.readFileSync('rsndata.json', 'utf-8'));
const { Client, IntentsBitField, ChannelType } = require('discord.js');
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});
const lootLogCreateChannelId = '1182760323531423775'; // Kanaal waarin lootlogs aangemaakt worden door gebruikers
const lootLogChannelId = '1340785898660429937'; // ID van forumkanaal waar threads aangemaakt moeten worden
const rsnSetupChannelId = '1342861064366194750'; // ID van het kanaal waarin gebruikers hun RSN kunnen instellen

// Als de bot online is, loggen we dit in de console
client.on('ready', (c) => { 
    console.log(`${c.user.tag} is online.`);
});

// Check of de bot online is
client.on('messageCreate', (message) => {
    if (message.content === 'sos bot status') {
        message.reply('Ik ben online!');
    }
});

// Event handler voor het instellen van de RSN
client.on('messageCreate', async (message) => {
    if (message.channel.id === rsnSetupChannelId && !message.author.bot) {
        const rsn = message.content.trim(); // Trim de inhoud van het bericht
        const userId = message.author.id; // ID van de gebruiker

        await message.delete();

        const existingUser = rsnData.users.find(user => user.userID === userId);
        if (existingUser) {
            existingUser.displayName = rsn;
            // Update de naam van de loot log als die bestaat
            if (existingUser.hasLootLog) {
                const forumChannel = await client.channels.fetch(lootLogChannelId);
                const lootLogThread = forumChannel.threads.cache.get(existingUser.lootLogId);
                if (lootLogThread) {
                    await lootLogThread.setName(rsn).catch(console.error);
                }
            }
        } else {
            rsnData.users.push({
                userID: userId,
                displayName: rsn,
                lootLogId: null,
                hasLootLog: false
            });
        }

        // Update de displayName (nickname) van de gebruiker op de server
        const member = message.guild.members.cache.get(userId);
        if (member) {
            await member.setNickname(rsn).catch(console.error);
            message.channel.send(`Jouw rsn en de naam van jouw Loot Log, indien je deze hebt, is aangepast naar ${rsn}!`);
        }

        fs.writeFileSync('rsndata.json', JSON.stringify(rsnData), 'utf-8');
    }
});

/*######################################################################
############################ LOOTLOGS ##################################
######################################################################*/

client.on('messageCreate', async (message) => {
    if (message.channel.id === lootLogCreateChannelId && !message.author.bot) {
        const lootLogTitle = message.content.trim(); // Gebruik de inhoud van het bericht als titel, in-game naam
        const userId = message.author.id; // ID van de gebruiker

        await message.delete();

        // Controleer of de gebruiker al een lootlog heeft
        const existingUser = rsnData.users.find(user => user.userID === userId);

        if (existingUser && existingUser.hasLootLog) {
            message.channel.send(`De Loot Log "${lootLogTitle}" aanmaken is mislukt. Je hebt al een Loot Log!`);
            console.log(`Gebruiker ${existingUser.displayName} heeft al een lootlog thread.`);
        } else {
            const forumChannel = await client.channels.fetch(lootLogChannelId);
            if (forumChannel && forumChannel.type === ChannelType.GuildForum) {
                // Update de displayName van de gebruiker op de server
                const member = message.guild.members.cache.get(userId);
                if (member) {
                    await member.setNickname(lootLogTitle).catch(console.error);
                }

                // Maak een nieuwe thread aan
                forumChannel.threads.create({
                    name: lootLogTitle,
                    message: {
                        content: `Loot log van ${lootLogTitle}`
                    }
                }).then((thread) => {
                    message.channel.send(`Loot Log aangemaakt voor: ${lootLogTitle}`);
                    console.log(`Thread aangemaakt met titel: ${lootLogTitle}`);

                    // Voeg de gebruiker toe aan de JSON-gegevens en sla op
                    if (existingUser) {
                        existingUser.displayName = lootLogTitle;
                        existingUser.lootLogId = thread.id;
                        existingUser.hasLootLog = true;
                    } else {
                        rsnData.users.push({
                            userID: userId,
                            displayName: lootLogTitle,
                            lootLogId: thread.id,
                            hasLootLog: true
                        });
                    }

                    fs.writeFileSync('rsndata.json', JSON.stringify(rsnData), 'utf-8');
                }).catch(console.error);
            } else {
                console.error('Kon het forumkanaal niet vinden of het is geen forumkanaal.');
            }
        }
    }
});

client.login(process.env.TOKEN);

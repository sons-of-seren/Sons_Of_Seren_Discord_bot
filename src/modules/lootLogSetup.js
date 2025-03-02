const { ChannelType } = require('discord.js');
const { lootLogCreateChannelId, lootLogChannelId } = require('../config/channelIdConfig.json');

module.exports = (client, connection) => {
    client.on('messageCreate', async (message) => {
        if (message.channel.id === lootLogCreateChannelId && !message.author.bot) {
            const lootLogTitle = message.content.trim();
            const userId = message.author.id;

            await message.delete();

            connection.query('SELECT * FROM users WHERE userID = ?', [userId], async (err, results) => {
                if (err) throw err;

                let existingUser = null;
                if (results.length > 0) {
                    existingUser = results[0];
                }

                if (existingUser && existingUser.hasLootLog) {
                    message.channel.send(`De Loot Log "${lootLogTitle}" aanmaken is mislukt. Je hebt al een Loot Log!`);
                    console.log(`Gebruiker ${existingUser.displayName} heeft al een lootlog thread.`);
                } else {
                    const forumChannel = await client.channels.fetch(lootLogChannelId);
                    if (forumChannel && forumChannel.type === ChannelType.GuildForum) {
                        const member = message.guild.members.cache.get(userId);
                        if (member) {
                            try {
                                await member.setNickname(lootLogTitle);
                            } catch (error) {
                                console.error(`Fout bij het wijzigen van bijnaam voor gebruiker ${userId}:`, error);
                            }
                        }

                        forumChannel.threads.create({
                            name: lootLogTitle,
                            message: {
                                content: `Loot log aangemaakt.`
                            }
                        }).then((thread) => {
                            message.channel.send(`Loot Log aangemaakt voor: ${lootLogTitle}`);
                            console.log(`Thread aangemaakt met titel: ${lootLogTitle}`);

                            if (existingUser) {
                                connection.query('UPDATE users SET displayName = ?, lootLogId = ?, hasLootLog = ? WHERE userID = ?', 
                                [lootLogTitle, thread.id, true, userId], (err, results) => {
                                    if (err) throw err;
                                    console.log('Gebruiker bijgewerkt in de database.');
                                });
                            } else {
                                connection.query('INSERT INTO users (userID, displayName, lootLogId, hasLootLog) VALUES (?, ?, ?, ?)', 
                                [userId, lootLogTitle, thread.id, true], (err, results) => {
                                    if (err) throw err;
                                    console.log('Nieuwe gebruiker toegevoegd aan de database.');
                                });
                            }
                        }).catch(console.error);
                    } else {
                        console.error('Kon het forumkanaal niet vinden of het is geen forumkanaal.');
                    }
                }
            });
        }
    });
};

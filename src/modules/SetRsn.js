const { lootLogChannelId, rsnSetupChannelId } = require('../config/channelIdConfig.json');

module.exports = (client, connection) => {
    client.on('messageCreate', async (message) => {
        if (message.channel.id === rsnSetupChannelId && !message.author.bot) {
            const rsn = message.content.trim();
            const userId = message.author.id;

            await message.delete();

            connection.query('SELECT * FROM users WHERE userID = ?', [userId], async (err, results) => {
                if (err) throw err;

                if (results.length > 0) {
                    // Bestaande gebruiker
                    const existingUser = results[0];
                    existingUser.displayName = rsn;

                    if (existingUser.hasLootLog) {
                        const forumChannel = await client.channels.fetch(lootLogChannelId);
                        const lootLogThread = forumChannel.threads.cache.get(existingUser.lootLogId);
                        if (lootLogThread) {
                            await lootLogThread.setName(rsn);
                        }
                    }

                    connection.query('UPDATE users SET displayName = ?, lootLogId = ?, hasLootLog = ? WHERE userID = ?', [rsn, existingUser.lootLogId, existingUser.hasLootLog, userId], (err, results) => {
                        if (err) throw err;
                    });
                } else {
                    // Nieuwe gebruiker
                    connection.query('INSERT INTO users (userID, displayName, lootLogId, hasLootLog) VALUES (?, ?, ?, ?)', [userId, rsn, null, false], (err, results) => {
                        if (err) throw err;
                    });
                }

                const member = message.guild.members.cache.get(userId);
                if (member) {
                    try {
                        await member.setNickname(rsn);
                        message.channel.send(`Jouw rsn en de naam van jouw Loot Log, indien je deze hebt, is aangepast naar ${rsn}!`);
                    } catch (error) {
                        console.error(`Fout bij het wijzigen van bijnaam voor gebruiker ${userId}:`, error);
                    }
                }
            });
        }
    });
};

const fs = require('fs');
const { lootLogCreateChannelId, lootLogChannelId } = require('../ChannelIdConfig.json');
let rsnData = JSON.parse(fs.readFileSync('rsndata.json', 'utf-8'));

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        if (message.channel.id === lootLogCreateChannelId && !message.author.bot) {
            const lootLogTitle = message.content.trim();
            const userId = message.author.id;

            await message.delete();

            const existingUser = rsnData.users.find(user => user.userID === userId);

            if (existingUser && existingUser.hasLootLog) {
                message.channel.send(`De Loot Log "${lootLogTitle}" aanmaken is mislukt. Je hebt al een Loot Log!`);
                console.log(`Gebruiker ${existingUser.displayName} heeft al een lootlog thread.`);
            } else {
                const forumChannel = await client.channels.fetch(lootLogChannelId);
                if (forumChannel && forumChannel.type === ChannelType.GuildForum) {
                    const member = message.guild.members.cache.get(userId);
                    if (member) {
                        await member.setNickname(lootLogTitle).catch(console.error);
                    }

                    forumChannel.threads.create({
                        name: lootLogTitle,
                        message: {
                            content: `Loot log van ${lootLogTitle}`
                        }
                    }).then((thread) => {
                        message.channel.send(`Loot Log aangemaakt voor: ${lootLogTitle}`);
                        console.log(`Thread aangemaakt met titel: ${lootLogTitle}`);

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
};

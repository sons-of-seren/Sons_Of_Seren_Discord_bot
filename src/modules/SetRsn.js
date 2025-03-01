const fs = require('fs');
const { lootLogChannelId, rsnSetupChannelId } = require('../ChannelIdConfig.json');
let rsnData = JSON.parse(fs.readFileSync('rsndata.json', 'utf-8'));

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        if (message.channel.id === rsnSetupChannelId && !message.author.bot) {
            const rsn = message.content.trim();
            const userId = message.author.id;

            await message.delete();

            const existingUser = rsnData.users.find(user => user.userID === userId);
            if (existingUser) {
                existingUser.displayName = rsn;
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

            const member = message.guild.members.cache.get(userId);
            if (member) {
                await member.setNickname(rsn).catch(console.error);
                message.channel.send(`Jouw rsn en de naam van jouw Loot Log, indien je deze hebt, is aangepast naar ${rsn}!`);
            }

            fs.writeFileSync('rsndata.json', JSON.stringify(rsnData), 'utf-8');
        }
    });
};

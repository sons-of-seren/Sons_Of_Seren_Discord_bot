module.exports = (client) => {
    client.on('messageCreate', (message) => {
        if (message.content === 'sos bot status') {
            message.reply('Ik ben online!');
        }
    });
};

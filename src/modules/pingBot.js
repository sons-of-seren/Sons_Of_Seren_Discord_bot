module.exports = (client) => {
    client.on('messageCreate', (message) => {
        if (message.content === 'ping bot') {
            message.reply('Ik ben online!');
        }
    });
};

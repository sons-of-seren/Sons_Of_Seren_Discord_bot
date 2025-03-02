// Log dat de bot online is
module.exports = (client) => {
    client.on('ready', (c) => {
        console.log(`${c.user.tag} is online.`);
    });
};
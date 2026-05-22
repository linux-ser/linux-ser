const songCommand = require('./song');

async function playCommand(sock, chatId, message) {

    try {

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        // REMOVE .play
        const query = text
            .replace(/^\.play\s*/i, '')
            .trim();

        // EMPTY QUERY FIX
        if (!query) {

            await sock.sendMessage(chatId, {
                react: {
                    text: '⚠️',
                    key: message.key
                }
            });

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🎵 Play Downloader 〕━━━╮
┃ ✦ Please provide
┃ ✦ a song name or link
┃
┃ 📌 Example:
┃ ✦ .play faded
┃ ✦ .play believer
┃ ✦ .play https://youtu.be/xxxx
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        // USE SONG COMMAND
        await songCommand(
            sock,
            chatId,
            message,
            query.split(' ')
        );

    } catch (err) {

        console.error(
            'Play command error:',
            err
        );

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ❌ Play Failed 〕━━━╮
┃ ✦ Failed to process song
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`
        }, {
            quoted: message
        });
    }
}

module.exports = playCommand;

const songCommand = require('./song');

async function playCommand(
    sock,
    chatId,
    message,
    args = []
) {

    try {

        // ================= GET MESSAGE =================

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        // REMOVE .play
        let query = text
            .replace(/^\.play/i, '')
            .trim();

        // USE ARGS IF AVAILABLE
        if (
            Array.isArray(args) &&
            args.length > 0
        ) {

            query = args.join(' ').trim();
        }

        // ================= EMPTY QUERY =================

        if (!query || query.length === 0) {

            await sock.sendMessage(chatId, {
                react: {
                    text: '⚠️',
                    key: message.key
                }
            });

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🎵 Play Downloader 〕━━━╮
┃ ✦ Please provide a song name
┃
┃ 📌 Example:
┃ ✦ .play faded
┃ ✦ .play believer
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        // ================= RUN SONG COMMAND =================

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

        // ERROR REACTION
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

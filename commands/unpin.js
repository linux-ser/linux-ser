async function unpinCommand(sock, chatId, message) {

    try {

        const quoted = message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.quotedMessage) {

            return sock.sendMessage(chatId, {
                text: 'Reply to a message!'
            }, { quoted: message });

        }

        // React
        await sock.sendMessage(chatId, {
            react: {
                text: '📍',
                key: message.key
            }
        });

        // Send unpin text
        await sock.sendMessage(chatId, {
            text: '🧃 ᴜɴᴘɪɴɴᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ'
        }, { quoted: message });

    } catch (e) {

        console.log('UNPIN ERROR:', e);

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

    }

}

module.exports = unpinCommand;

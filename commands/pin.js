async function pinCommand(sock, chatId, message) {

    try {

        const quoted = message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.quotedMessage) {
            return sock.sendMessage(chatId, {
                text: 'Reply to a message to pin!'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '📌',
                key: message.key
            }
        });

        let text = '📌 *PINNED MESSAGE*\n\n';

        if (quoted.quotedMessage.conversation) {
            text += quoted.quotedMessage.conversation;
        }

        else if (quoted.quotedMessage.extendedTextMessage?.text) {
            text += quoted.quotedMessage.extendedTextMessage.text;
        }

        else {
            text += '_Media message pinned_';
        }

        text += '\n\n🧃 ᴘɪɴɴᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ';

        await sock.sendMessage(chatId, {
            text
        });

    } catch (e) {

        console.log('PIN ERROR:', e);

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

    }
}

module.exports = pinCommand;

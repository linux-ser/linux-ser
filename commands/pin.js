async function pinCommand(sock, chatId, message) {

    try {

        const quoted = message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.stanzaId) {
            return sock.sendMessage(chatId, {
                text: 'Reply to a message to pin it!'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '📌',
                key: message.key
            }
        });

        // Pin message
        await sock.chatModify({
            pin: {
                type: 1,
                time: 86400,
                key: {
                    remoteJid: chatId,
                    fromMe: quoted.participant === sock.user.id,
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            }
        }, chatId);

        await sock.sendMessage(chatId, {
            text: '📌 Message pinned successfully!'
        }, { quoted: message });

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

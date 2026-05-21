async function unpinCommand(sock, chatId, message) {

    try {

        const quoted = message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.stanzaId) {
            return sock.sendMessage(chatId, {
                text: 'Reply to a pinned message!'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '📍',
                key: message.key
            }
        });

        // Unpin message
        await sock.chatModify({
            pin: {
                type: 0,
                key: {
                    remoteJid: chatId,
                    fromMe: quoted.participant === sock.user.id,
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            }
        }, chatId);

        await sock.sendMessage(chatId, {
            text: '✅ Message unpinned successfully!'
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

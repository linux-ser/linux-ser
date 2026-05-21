async function unpinCommand(sock, chatId, message) {

    try {

        const quoted = message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.stanzaId) {
            return sock.sendMessage(chatId, {
                text: 'Reply to pinned message!'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '📍',
                key: message.key
            }
        });

        // Unpin message
        await sock.sendMessage(chatId, {
            pin: {
                type: 0,
                key: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            }
        });

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

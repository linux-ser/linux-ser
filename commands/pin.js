async function pinCommand(sock, chatId, message) {

    try {

        const quoted = message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.stanzaId) {
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

        // Pin message
        await sock.sendMessage(chatId, {
            pin: {
                type: 1,
                time: 86400,
                key: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            }
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

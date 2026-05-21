async function readmoreCommand(sock, chatId, message, text) {

    try {

        if (!text) {

            return sock.sendMessage(chatId, {
                text: 'Example: .readmore Hello'
            }, { quoted: message });

        }

        // Invisible readmore character
        const more = String.fromCharCode(8206).repeat(4001);

        // Final message
        const finalText = `${text}${more}

🧃 ʀᴇᴀᴅᴍᴏʀᴇ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ`;

        await sock.sendMessage(chatId, {
            text: finalText
        }, { quoted: message });

    } catch (e) {

        console.log('READMORE ERROR:', e);

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

    }

}

module.exports = readmoreCommand;

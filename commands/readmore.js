async function readmoreCommand(sock, chatId, message, text) {

    try {

        if (!text.includes(',')) {

            return sock.sendMessage(chatId, {
                text: 'Example: .readmore hello, haha'
            }, { quoted: message });

        }

        // Split text
        const parts = text.split(',');

        const firstText = parts[0].trim();
        const secondText = parts.slice(1).join(',').trim();

        // Invisible readmore trigger
        const more = String.fromCharCode(8206).repeat(4000);

        // 70 lines after click
        const lines = '\n'.repeat(70);

        // Final output
        const finalText =
`${firstText}${more}${lines}${secondText}`;

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

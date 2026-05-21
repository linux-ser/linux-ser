async function readmoreCommand(sock, chatId, message, text) {

    try {

        if (!text.includes(',')) {

            return sock.sendMessage(chatId, {
                text: 'Example: .readmore hello, haha'
            }, { quoted: message });

        }

        // Split texts
        const [firstText, secondText] = text
            .split(',');

        // Invisible readmore trigger
        const more = String.fromCharCode(8206).repeat(4000);

        // Final message
        const finalText =
`${firstText}${more}${secondText}`;

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

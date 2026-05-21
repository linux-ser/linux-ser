async function readmoreCommand(
    sock,
    chatId,
    message,
    text
) {

    try {

        // ======================
        // CHECK INPUT
        // ======================

        if (!text.includes(',')) {

            await sock.sendMessage(chatId, {

                react: {
                    text: '📖',
                    key: message.key
                }

            });

            return sock.sendMessage(chatId, {

                text:
`╭━━━〔 📖 Readmore Tool 〕━━━╮
┃ ✦ Please provide text
┃ ✦ using comma separator
┃
┃ ✦ Example:
┃ ✦ .readmore hello, haha
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '📚',
                key: message.key
            }

        });

        // ======================
        // SPLIT TEXT
        // ======================

        const parts =
        text.split(',');

        const firstText =
        parts[0]
        .replace('.readmore', '')
        .trim();

        const secondText =
        parts
        .slice(1)
        .join(',')
        .trim();

        // ======================
        // INVISIBLE TEXT
        // ======================

        const more =
        String.fromCharCode(8206)
        .repeat(4000);

        // ======================
        // EXTRA LINES
        // ======================

        const lines =
        '\n'.repeat(200);

        // ======================
        // FINAL TEXT
        // ======================

        const finalText =

`${firstText}${more}${lines}${secondText}`;

        // ======================
        // SEND MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
            finalText

        }, { quoted: message });

        // ======================
        // SUCCESS REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '✅',
                key: message.key
            }

        });

    } catch (e) {

        console.log(
            'READMORE ERROR:',
            e
        );

        // ======================
        // ERROR REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '❌',
                key: message.key
            }

        });

        // ======================
        // ERROR MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Readmore Error 〕━━━╮
┃ ✦ Failed to create
┃ ✦ readmore message
┃
┃ ✦ Try again later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = readmoreCommand;

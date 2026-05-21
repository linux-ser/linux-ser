const math = require('mathjs');

// ======================
// CALC COMMAND
// ======================

async function calcCommand(
    sock,
    chatId,
    message,
    text
) {

    try {

        // ======================
        // REACTION FUNCTION
        // ======================

        const react = async (
            emoji
        ) => {

            await sock.sendMessage(chatId, {

                react: {
                    text: emoji,
                    key: message.key
                }

            });

        };

        // ======================
        // NO INPUT
        // ======================

        if (!text) {

            await react('🧮');

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🧮 Calculator 〕━━━╮
┃ ✦ Please provide
┃ ✦ a math expression
┃
┃ 📌 Example:
┃ ✦ .calc 2+2
┃ ✦ .calc 10*5
┃ ✦ .calc sqrt(25)
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // LOADING REACTION
        // ======================

        await react('⚡');

        // ======================
        // CALCULATE
        // ======================

        const result =
        math.evaluate(text);

        // ======================
        // RESULT MESSAGE
        // ======================

        const resultMessage =

`╭━━━〔 🧮 Calculator 〕━━━╮
┃ 📥 Expression:
┃ ✦ ${text}
┃
┃ ✨ Result:
┃ ✦ ${result}
╰━━━━━━━━━━━━━━━━━━╯

> Powered By 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        // ======================
        // SEND RESULT
        // ======================

        await sock.sendMessage(chatId, {

            text:
            resultMessage

        }, { quoted: message });

        // ======================
        // SUCCESS REACTION
        // ======================

        await react('✅');

    }

    catch (error) {

        console.error(
            'Calc Command Error:',
            error
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
`╭━━━〔 ❌ Calculator Error 〕━━━╮
┃ ✦ Invalid math
┃ ✦ expression
┃
┃ 📌 Example:
┃ ✦ .calc 5+5
╰━━━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = calcCommand;

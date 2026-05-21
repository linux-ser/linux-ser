const axios = require('axios');

async function imagineCommand(
    sock,
    chatId,
    message
) {

    try {

        // ======================
        // GET MESSAGE TEXT
        // ======================

        const text =
        message.message?.conversation ||

        message.message?.extendedTextMessage?.text ||

        '';

        // ======================
        // GET PROMPT
        // ======================

        const prompt =
        text.replace('.imagine', '').trim();

        // ======================
        // CHECK PROMPT
        // ======================

        if (!prompt) {

            await sock.sendMessage(chatId, {

                react: {
                    text: '🎨',
                    key: message.key
                }

            });

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🎨 Imagine AI 〕━━━╮
┃ ✦ Please provide a prompt
┃ ✦ Example:
┃ ✦ .imagine beautiful sunset
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // LOADING REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '🪄',
                key: message.key
            }

        });

        // ======================
        // LOADING MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 🖼️ Generating 〕━━━╮
┃ ✦ Creating your image...
┃ ✦ Please wait a moment
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

        // ======================
        // IMAGE URL
        // ======================

        const imageUrl =

`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=1&model=flux`;

        // ======================
        // DOWNLOAD IMAGE
        // ======================

        const response =
        await axios.get(imageUrl, {

            responseType:
            'arraybuffer'

        });

        const buffer =
        Buffer.from(response.data);

        // ======================
        // SEND IMAGE
        // ======================

        await sock.sendMessage(chatId, {

            image: buffer,

            caption:
`╭━━━〔 🎨 Imagine Result 〕━━━╮
┃ ✦ Prompt: ${prompt}
╰━━━━━━━━━━━━━━━━━━╯`

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

    } catch (err) {

        console.log(
            'Imagine Error:',
            err
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
`╭━━━〔 ❌ Imagine Error 〕━━━╮
┃ ✦ Failed to generate image
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = imagineCommand;

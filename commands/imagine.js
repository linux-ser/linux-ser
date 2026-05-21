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

            return await sock.sendMessage(chatId, {

                text:
`🖼️ Please provide a prompt.

Example:
.imagine beautiful sunset`

            }, { quoted: message });

        }

        // ======================
        // LOADING MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
'🎨 Generating image...'

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
`🎨 Prompt:
${prompt}`

        }, { quoted: message });

    } catch (err) {

        console.log(
            'Imagine Error:',
            err
        );

        await sock.sendMessage(chatId, {

            text:
'❌ Failed to generate image.'

        }, { quoted: message });

    }

}

module.exports = imagineCommand;

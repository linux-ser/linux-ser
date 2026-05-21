const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// ======================
// ATTP COMMAND
// ======================

async function attpCommand(
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
        // CHECK TEXT
        // ======================

        if (!text) {

            await react('🎨');

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🎨 ATTP Sticker 〕━━━╮
┃ ✦ Please provide text
┃ ✦ to create sticker
┃
┃ 📌 Example:
┃ ✦ .attp Hello
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // LOADING REACTION
        // ======================

        await react('🪄');

        // ======================
        // API URL
        // ======================

        const apiUrl =

`https://api.xteam.xyz/attp?file&text=${encodeURIComponent(text)}`;

        // ======================
        // TMP DIRECTORY
        // ======================

        const tmpDir =
        path.join(
            process.cwd(),
            'tmp'
        );

        if (
            !fs.existsSync(tmpDir)
        ) {

            fs.mkdirSync(

                tmpDir,

                {
                    recursive: true
                }

            );

        }

        // ======================
        // FILE PATHS
        // ======================

        const gifPath =
        path.join(

            tmpDir,

`attp_${Date.now()}.gif`

        );

        const webpPath =
        path.join(

            tmpDir,

`attp_${Date.now()}.webp`

        );

        // ======================
        // DOWNLOAD GIF
        // ======================

        const response =
        await axios({

            method: 'GET',

            url: apiUrl,

            responseType: 'arraybuffer'

        });

        fs.writeFileSync(
            gifPath,
            response.data
        );

        // ======================
        // CONVERT TO WEBP
        // ======================

        await new Promise(

            (
                resolve,
                reject
            ) => {

                ffmpeg(gifPath)

                .outputOptions([

                    '-vcodec',
                    'libwebp',

                    '-vf',

'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0',

                    '-loop',
                    '0',

                    '-preset',
                    'default',

                    '-an',

                    '-vsync',
                    '0'

                ])

                .toFormat('webp')

                .save(webpPath)

                .on(
                    'end',
                    resolve
                )

                .on(
                    'error',
                    reject
                );

            }

        );

        // ======================
        // READ WEBP
        // ======================

        const webpBuffer =
        fs.readFileSync(
            webpPath
        );

        // ======================
        // SEND STICKER
        // ======================

        await sock.sendMessage(chatId, {

            sticker:
            webpBuffer,

            packname:
            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',

            author:
            'ATTP Sticker'

        }, { quoted: message });

        // ======================
        // SUCCESS REACTION
        // ======================

        await react('✅');

        // ======================
        // CLEANUP
        // ======================

        try {

            if (
                fs.existsSync(gifPath)
            ) {

                fs.unlinkSync(
                    gifPath
                );

            }

            if (
                fs.existsSync(webpPath)
            ) {

                fs.unlinkSync(
                    webpPath
                );

            }

        }

        catch (_) {}

    }

    catch (error) {

        console.error(
            'ATTP ERROR:',
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
`╭━━━〔 ❌ ATTP Error 〕━━━╮
┃ ✦ Failed to create
┃ ✦ animated sticker
┃
┃ 📌 Try again later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = attpCommand;

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const {
    downloadMediaMessage
} = require('@whiskeysockets/baileys');

const cutAudio = async (
    sock,
    chatId,
    message,
    userMessage,
    logger
) => {

    try {

        // =========================
        // GET QUOTED MESSAGE
        // =========================

        const quoted =
        message.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.quotedMessage;

        if (!quoted) {

            return await sock.sendMessage(chatId, {

                text:
`❌ Reply to an audio message.

Example:
.cut 0:30 1:00`

            }, { quoted: message });

        }

        // =========================
        // DETECT AUDIO
        // =========================

        const mediaMessage =
            quoted.audioMessage ||
            quoted.documentMessage ||
            quoted.videoMessage;

        if (!mediaMessage) {

            return await sock.sendMessage(chatId, {

                text:
'❌ Replied message is not audio.'

            }, { quoted: message });

        }

        // =========================
        // GET TIMES
        // =========================

        const args =
        userMessage.trim().split(/\s+/).slice(1);

        if (args.length < 2) {

            return await sock.sendMessage(chatId, {

                text:
`❌ Example:
.cut 0:30 1:00`

            }, { quoted: message });

        }

        const start = args[0];
        const end = args[1];

        // =========================
        // REACTION
        // =========================

        await sock.sendMessage(chatId, {

            react: {
                text: '✂️',
                key: message.key
            }

        });

        // =========================
        // DOWNLOAD MEDIA
        // =========================

        const buffer =
        await downloadMediaMessage(

            {
                message: quoted
            },

            'buffer',

            {},

            {
                logger,
                reuploadRequest:
                sock.updateMediaMessage
            }

        );

        // =========================
        // TEMP
        // =========================

        const tempDir =
        path.join(__dirname, '../temp');

        if (!fs.existsSync(tempDir)) {

            fs.mkdirSync(tempDir);

        }

        const timestamp =
        Date.now();

        const inputPath =
        path.join(
            tempDir,
            `${timestamp}.mp3`
        );

        const outputPath =
        path.join(
            tempDir,
            `${timestamp}_cut.mp3`
        );

        const finalPath =
        path.join(
            tempDir,
            `${timestamp}_final.mp3`
        );

        // =========================
        // COVER IMAGE
        // =========================

        const coverPath =
        path.join(
            __dirname,
            '../assets/bot_image.jpg'
        );

        fs.writeFileSync(
            inputPath,
            buffer
        );

        // =========================
        // CUT AUDIO
        // =========================

        exec(

`ffmpeg -y -i "${inputPath}" -ss ${start} -to ${end} -vn -c:a libmp3lame -b:a 320k "${outputPath}"`,

        async (err) => {

            if (err) {

                console.log(
                    'Cut Error:',
                    err
                );

                return await sock.sendMessage(chatId, {

                    text:
                    '❌ Failed to cut audio.'

                }, { quoted: message });

            }

            // =========================
            // METADATA
            // =========================

            let ffmpegCmd;

            if (fs.existsSync(coverPath)) {

                ffmpegCmd =

`ffmpeg -y \
-i "${outputPath}" \
-i "${coverPath}" \
-map 0:a \
-map 1:v \
-c:a copy \
-c:v mjpeg \
-id3v2_version 3 \
-metadata title="♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ" \
-metadata artist="𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️" \
-metadata album="Premium Audio Cutter" \
"${finalPath}"`;

            } else {

                ffmpegCmd =

`ffmpeg -y \
-i "${outputPath}" \
-c:a copy \
-metadata title="♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ" \
-metadata artist="𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️" \
-metadata album="Premium Audio Cutter" \
"${finalPath}"`;

            }

            exec(ffmpegCmd,

            async (metaErr) => {

                if (metaErr) {

                    console.log(
                        'Metadata Error:',
                        metaErr
                    );

                }

                // =========================
                // SEND AUDIO
                // =========================

                await sock.sendMessage(chatId, {

                    audio: {
                        url: finalPath
                    },

                    mimetype:
                    'audio/mpeg',

                    ptt: false,

                    fileName:
                    'linuxser.mp3',

                    contextInfo: {

                        externalAdReply: {

                            showAdAttribution: false,

                            title:
                            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',

                            body:
`🎵 Cut Audio • ${start} → ${end}`,

                            mediaType: 1,

                            renderLargerThumbnail: true,

                            thumbnailUrl:
'https://o.uguu.se/kYrlzKnK.jpg'

                        }

                    }

                }, { quoted: message });

                // =========================
                // SUCCESS
                // =========================

                await sock.sendMessage(chatId, {

                    react: {
                        text: '✅',
                        key: message.key
                    }

                });

                // =========================
                // DELETE TEMP
                // =========================

                [
                    inputPath,
                    outputPath,
                    finalPath
                ].forEach(file => {

                    if (
                        fs.existsSync(file)
                    ) {

                        fs.unlinkSync(file);

                    }

                });

            });

        });

    } catch (error) {

        console.log(
            'Cut Command Error:',
            error
        );

        await sock.sendMessage(chatId, {

            text:
            '❌ Error processing audio.'

        }, { quoted: message });

    }

};

module.exports = cutAudio;

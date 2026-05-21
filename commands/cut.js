const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const {
    downloadMediaMessage
} = require('@whiskeysockets/baileys');

module.exports = async (
    sock,
    chatId,
    message,
    body,
    logger
) => {

    try {

        // =========================
        // CHECK REPLY AUDIO
        // =========================

        const quoted =
        message.message?.extendedTextMessage
        ?.contextInfo?.quotedMessage;

        const audioMsg =
        quoted?.audioMessage ||
        message.message?.audioMessage;

        if (!audioMsg) {

            return await sock.sendMessage(chatId, {

                text:
`❌ Reply to an audio.

Example:
.cutaudio 0:30 1:00`

            }, { quoted: message });

        }

        // =========================
        // GET START & END
        // =========================

        const args =
        body.split(' ').slice(1);

        if (args.length < 2) {

            return await sock.sendMessage(chatId, {

                text:
`❌ Example:
.cutaudio 0:30 1:00`

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
        // DOWNLOAD AUDIO
        // =========================

        const buffer =
        await downloadMediaMessage(

            {
                message: {
                    audioMessage: audioMsg
                }
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
        // TEMP FOLDER
        // =========================

        const tempDir =
        path.join(__dirname, '../temp');

        if (!fs.existsSync(tempDir)) {

            fs.mkdirSync(tempDir);

        }

        const inputPath =
        path.join(
            tempDir,
            `${Date.now()}.mp3`
        );

        const outputPath =
        path.join(
            tempDir,
            `${Date.now()}_cut.mp3`
        );

        const finalPath =
        path.join(
            tempDir,
            `${Date.now()}_final.mp3`
        );

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

`ffmpeg -y -i "${inputPath}" -ss ${start} -to ${end} -c:a libmp3lame -b:a 320k "${outputPath}"`,

        async (err) => {

            if (err) {

                console.log(
                    'FFmpeg Error:',
                    err
                );

                return await sock.sendMessage(chatId, {

                    text:
                    '❌ Failed to cut audio.'

                }, { quoted: message });

            }

            // =========================
            // ADD COVER + METADATA
            // =========================

            let ffmpegCmd;

            if (fs.existsSync(coverPath)) {

                ffmpegCmd =

`ffmpeg -y \
-i "${outputPath}" \
-i "${coverPath}" \
-map 0:a \
-map 1:v \
-c:a libmp3lame \
-b:a 320k \
-c:v mjpeg \
-id3v2_version 3 \
-metadata title="♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ" \
-metadata artist="𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️" \
-metadata album="Premium Audio Cutter" \
-metadata comment="Cut Audio Command" \
"${finalPath}"`;

            } else {

                ffmpegCmd =

`ffmpeg -y \
-i "${outputPath}" \
-c:a libmp3lame \
-b:a 320k \
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
                // SUCCESS REACTION
                // =========================

                await sock.sendMessage(chatId, {

                    react: {
                        text: '✅',
                        key: message.key
                    }

                });

                // =========================
                // DELETE TEMP FILES
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
            'Cut Audio Error:',
            error
        );

        await sock.sendMessage(chatId, {

            text:
            '❌ Error cutting audio.'

        }, { quoted: message });

    }

};

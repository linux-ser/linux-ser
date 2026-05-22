const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const ffmpeg = require('fluent-ffmpeg');

const ffmpegPath =
    require('ffmpeg-static');

ffmpeg.setFfmpegPath(
    ffmpegPath
);

const NodeID3 =
    require('node-id3');

const fs = require('fs');
const path = require('path');

async function bassCommand(sock, chatId, message) {

    try {

        const quoted =
            message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.quotedMessage) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🎵 Bass Boost 〕━━━╮
┃
┃ ✦ Reply to an audio/video
┃ ✦ Then use:
┃ ✦ .bass
┃
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });

        }

        const qmsg = quoted.quotedMessage;

        let stream;
        let ext;

        // ================= AUDIO =================

        if (qmsg.audioMessage) {

            stream = await downloadContentFromMessage(
                qmsg.audioMessage,
                'audio'
            );

            ext = 'mp3';

        }

        // ================= VIDEO =================

        else if (qmsg.videoMessage) {

            stream = await downloadContentFromMessage(
                qmsg.videoMessage,
                'video'
            );

            ext = 'mp4';

        }

        else {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Invalid Media 〕━━━╮
┃
┃ ✦ Reply to:
┃ ✦ Audio or video only
┃
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });

        }

        // ================= REACT =================

        await sock.sendMessage(chatId, {
            react: {
                text: '🎧',
                key: message.key
            }
        });

        // ================= BUFFER =================

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {

            buffer = Buffer.concat([
                buffer,
                chunk
            ]);

        }

        // ================= TEMP =================

        const tempDir =
            path.join(
                __dirname,
                '../temp'
            );

        if (!fs.existsSync(tempDir)) {

            fs.mkdirSync(tempDir, {
                recursive: true
            });

        }

        const inputPath =
            path.join(
                tempDir,
                `${Date.now()}.${ext}`
            );

        const outputPath =
            path.join(
                tempDir,
                `${Date.now()}_bass.mp3`
            );

        fs.writeFileSync(
            inputPath,
            buffer
        );

        // ================= PROCESS =================

        await new Promise((resolve, reject) => {

            ffmpeg(inputPath)

                .audioFilters([
                    'bass=g=20',
                    'volume=1.5'
                ])

                .audioCodec('libmp3lame')

                .audioBitrate('192k')

                .format('mp3')

                .save(outputPath)

                .on('end', resolve)

                .on('error', reject);

        });

        // ================= METADATA =================

        NodeID3.write({

            title:
                '♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ',

            artist:
                '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',

            album:
                '𝐋ɪɴᴜх 𝐒ᴇʀ',

            performerInfo:
                '𝐋ɪɴᴜх 𝐒ᴇʀ',

            image: {
                mime: 'image/jpeg',

                type: {
                    id: 3,
                    name: 'front cover'
                },

                description:
                    'Cover',

                imageBuffer:
                    fs.readFileSync(
                        path.join(
                            __dirname,
                            '../assets/bot_image.jpg'
                        )
                    )
            }

        }, outputPath);

        // ================= SEND AUDIO =================

        await sock.sendMessage(chatId, {

            audio: {
                url: outputPath
            },

            mimetype:
                'audio/mpeg',

            ptt: false,

            fileName:
                'linuxser.mp3',

            jpegThumbnail:
                fs.readFileSync(
                    path.join(
                        __dirname,
                        '../assets/bot_image.jpg'
                    )
                )

        }, {
            quoted: message
        });

        // ================= SUCCESS =================

        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

        // ================= CLEANUP =================

        setTimeout(() => {

            try {

                if (
                    fs.existsSync(inputPath)
                ) {

                    fs.unlinkSync(
                        inputPath
                    );
                }

                if (
                    fs.existsSync(outputPath)
                ) {

                    fs.unlinkSync(
                        outputPath
                    );
                }

            } catch {}

        }, 120000);

    } catch (err) {

        console.log(
            'BASS ERROR:',
            err
        );

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ❌ Bass Failed 〕━━━╮
┃
┃ ✦ Failed to process audio
┃ ✦ Try another media
┃
╰━━━━━━━━━━━━━━━━━━╯`
        }, {
            quoted: message
        });

    }

}

module.exports = bassCommand;

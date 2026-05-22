const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');

const fs = require('fs');
const path = require('path');

async function tomp3Command(sock, chatId, message) {

    try {

        const quoted =
            message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.quotedMessage) {

            return sock.sendMessage(chatId, {
                text:
`╭━━━〔 ⚠️ Reply Required 〕━━━╮
┃
┃ ✦ Reply to a video or audio
┃ ✦ Then use the command again
┃
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });

        }

        const qmsg = quoted.quotedMessage;

        let stream;
        let ext;

        // ================= VIDEO =================

        if (qmsg.videoMessage) {

            stream = await downloadContentFromMessage(
                qmsg.videoMessage,
                'video'
            );

            ext = 'mp4';

        }

        // ================= AUDIO =================

        else if (qmsg.audioMessage) {

            stream = await downloadContentFromMessage(
                qmsg.audioMessage,
                'audio'
            );

            ext = 'mp3';

        }

        else {

            return sock.sendMessage(chatId, {
                text:
`╭━━━〔 ⚠️ Unsupported Media 〕━━━╮
┃
┃ ✦ Reply only to:
┃ ✦ Video or audio files
┃
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });

        }

        // ================= REACTION =================

        await sock.sendMessage(chatId, {
            react: {
                text: '🎵',
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

        // ================= TEMP FOLDER =================

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
                `${Date.now()}.mp3`
            );

        fs.writeFileSync(
            inputPath,
            buffer
        );

        // ================= CONVERT =================

        await new Promise((resolve, reject) => {

            ffmpeg(inputPath)
                .audioCodec('libmp3lame')
                .audioBitrate(128)
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

                description: 'Cover',

                imageBuffer:
                    fs.readFileSync(
                        path.join(
                            __dirname,
                            '../assets/bot_image.jpg'
                        )
                    )
            }

        }, outputPath);

        // ================= FINAL BUFFER =================

        const audioBuffer =
            fs.readFileSync(outputPath);

        // ================= SEND DOCUMENT =================

        await sock.sendMessage(chatId, {

            document: audioBuffer,

            mimetype:
                'audio/mpeg',

            fileName:
                'linuxser.mp3'

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

        }, 30000);

    } catch (e) {

        console.log(
            'TOMP3 ERROR:',
            e
        );

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ❌ Convert Failed 〕━━━╮
┃
┃ ✦ Failed to convert media
┃ ✦ Try another file
┃
╰━━━━━━━━━━━━━━━━━━╯`
        }, {
            quoted: message
        });

    }

}

module.exports = tomp3Command;

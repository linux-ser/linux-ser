const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');

const fs = require('fs');
const path = require('path');

async function bassCommand(sock, chatId, message) {

    try {

        const quoted =
            message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.quotedMessage) {

            return await sock.sendMessage(chatId, {
                text: 'Reply to audio or video!'
            }, { quoted: message });

        }

        const qmsg = quoted.quotedMessage;

        let stream;
        let type;

        // Audio
        if (qmsg.audioMessage) {

            stream = await downloadContentFromMessage(
                qmsg.audioMessage,
                'audio'
            );

            type = 'mp3';

        }

        // Video
        else if (qmsg.videoMessage) {

            stream = await downloadContentFromMessage(
                qmsg.videoMessage,
                'video'
            );

            type = 'mp4';

        }

        else {

            return await sock.sendMessage(chatId, {
                text: 'Reply to audio or video!'
            }, { quoted: message });

        }

        // React
        await sock.sendMessage(chatId, {
            react: {
                text: '🎧',
                key: message.key
            }
        });

        // Buffer
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {

            buffer = Buffer.concat([
                buffer,
                chunk
            ]);

        }

        // Temp folder
        const tempDir =
            path.join(__dirname, '../temp');

        if (!fs.existsSync(tempDir)) {

            fs.mkdirSync(tempDir, {
                recursive: true
            });

        }

        // Paths
        const inputPath =
            path.join(
                tempDir,
                `${Date.now()}.${type}`
            );

        const outputPath =
            path.join(
                tempDir,
                `${Date.now()}.mp3`
            );

        // Save input
        fs.writeFileSync(inputPath, buffer);

        // Bass boost
        await new Promise((resolve, reject) => {

            ffmpeg(inputPath)
                .audioFilter('bass=g=15')
                .audioCodec('libmp3lame')
                .format('mp3')
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);

        });

        // Add metadata + image
        NodeID3.write({

            title: '♫ 𝐋ɪɴᴜх 𝐕ɪʙᴇꜱ',
            artist: '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',
            album: '🎧 𝐁𝐚𝐬𝐬 𝐁ᴏᴏ𝐬𝐭',
            performerInfo: '𝐋ɪɴᴜх 𝐒ᴇʀ',

            image: {
                mime: 'image/jpeg',
                type: {
                    id: 3,
                    name: 'front cover'
                },
                description: 'Cover',
                imageBuffer: fs.readFileSync(
                    path.join(
                        __dirname,
                        '../assets/bot_image.jpg'
                    )
                )
            }

        }, outputPath);

        // Read output
        const audioBuffer =
            fs.readFileSync(outputPath);

        // Send audio
        await sock.sendMessage(chatId, {

            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,

            fileName:
            'linuxser.mp3',

            contextInfo: {
                externalAdReply: {
                    title: '♫ 𝐋ɪɴᴜх 𝐕ɪʙᴇꜱ',
                    body: '🎧 Bass Boosted Audio',
                    thumbnailUrl:
                    'https://o.uguu.se/kYrlzKnK.jpg',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }

        }, { quoted: message });

        // Cleanup
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        // Done react
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (e) {

        console.log('BASS ERROR:', e);

        await sock.sendMessage(chatId, {
            text: `❌ Error:\n${e.message}`
        }, { quoted: message });

    }

}

module.exports = bassCommand;

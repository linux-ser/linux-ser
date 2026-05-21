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
                text: 'Reply to video or audio!'
            }, { quoted: message });

        }

        const qmsg = quoted.quotedMessage;

        let stream;
        let ext;

        // Video
        if (qmsg.videoMessage) {

            stream = await downloadContentFromMessage(
                qmsg.videoMessage,
                'video'
            );

            ext = 'mp4';

        }

        // Audio
        else if (qmsg.audioMessage) {

            stream = await downloadContentFromMessage(
                qmsg.audioMessage,
                'audio'
            );

            ext = 'mp3';

        }

        else {

            return sock.sendMessage(chatId, {
                text: 'Reply to video or audio!'
            }, { quoted: message });

        }

        // React
        await sock.sendMessage(chatId, {
            react: {
                text: '🎵',
                key: message.key
            }
        });

        // Buffer
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {

            buffer = Buffer.concat([buffer, chunk]);

        }

        // Temp folder
        const tempDir =
            path.join(__dirname, '../temp');

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

        fs.writeFileSync(inputPath, buffer);

        // Convert to MP3
        await new Promise((resolve, reject) => {

            ffmpeg(inputPath)
                .toFormat('mp3')
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);

        });

        // Add MP3 metadata + cover
        NodeID3.write({

            title: '♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ',
            artist: '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',
            album: '𝐋ɪɴᴜх 𝐒ᴇʀ',
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

        // Final MP3
        const mp3Buffer =
            fs.readFileSync(outputPath);

        // Send MP3
        await sock.sendMessage(chatId, {

            audio: mp3Buffer,
            mimetype: 'audio/mpeg',
            fileName: 'linuxser.mp3',

            contextInfo: {
                externalAdReply: {
                    title: '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',
                    body: 'MP3 Converter',
                    thumbnailUrl: 'https://o.uguu.se/kYrlzKnK.jpg',
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

        console.log('TOMP3 ERROR:', e);

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

    }

}

module.exports = tomp3Command;

const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');

const fs = require('fs');
const path = require('path');

async function slowedCommand(sock, chatId, message) {

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
                text: '🎶',
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

        // Unique names
        const timestamp = Date.now();

        const inputPath =
            path.join(
                tempDir,
                `input_${timestamp}.${type}`
            );

        const outputPath =
            path.join(
                tempDir,
                `output_${timestamp}.mp3`
            );

        // Save input
        fs.writeFileSync(inputPath, buffer);

        // Slowed + Reverb
        await new Promise((resolve, reject) => {

            ffmpeg(inputPath)

                .audioFilters([

                    'atempo=0.90',

                    'asetrate=44100*0.88',

                    'aresample=44100',

                    'aecho=0.8:0.88:60:0.4',

                    'bass=g=6:f=110:w=0.6',

                    'volume=1.15'

                ])

                .audioCodec('libmp3lame')
                .audioBitrate(128)
                .format('mp3')
                .save(outputPath)

                .on('end', resolve)
                .on('error', reject);

        });

        // Check output
        if (!fs.existsSync(outputPath)) {

            throw new Error(
                'Audio conversion failed'
            );

        }

        // Add metadata + cover
        NodeID3.write({

            title:
            '♫ 𝐒ʟᴏᴡᴇᴅ + 𝐑ᴇᴠᴇʀʙ',

            artist:
            '𝐋ɪɴᴜх 𝐒ᴇʀ',

            album:
            '🎶 𝐕ɪʙᴇꜱ',

            performerInfo:
            '𝐋ɪɴᴜх 𝐒ᴇʀ',

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

        // Send audio
        await sock.sendMessage(chatId, {

            audio: {
                url: outputPath
            },

            mimetype: 'audio/mpeg',

            ptt: false,

            fileName:
            'linuxser.mp3',

            contextInfo: {
                externalAdReply: {

                    title:
                    '♫ 𝐒ʟᴏᴡᴇᴅ + 𝐑ᴇᴠᴇʀʙ',

                    body:
                    '🎶 Smooth Music Effect',

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

        // Success react
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (e) {

        console.log('SLOWED ERROR:', e);

        await sock.sendMessage(chatId, {
            text:
            `❌ Error:\n${e.message}`
        }, { quoted: message });

    }

}

module.exports = slowedCommand;

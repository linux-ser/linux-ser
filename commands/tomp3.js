const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const ffmpeg = require('fluent-ffmpeg');

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

        // Convert
        await new Promise((resolve, reject) => {

            ffmpeg(inputPath)
                .toFormat('mp3')
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);

        });

        // Read mp3
        const mp3Buffer =
            fs.readFileSync(outputPath);

        // Send mp3
        await sock.sendMessage(chatId, {
            audio: mp3Buffer,
            mimetype: 'audio/mpeg',
            fileName: 'converted.mp3'
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

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { toPTT } = require('../lib/converter');

async function tovnCommand(sock, chatId, message) {

    try {

        const quoted = message.message?.extendedTextMessage?.contextInfo;

        if (!quoted || !quoted.quotedMessage) {
            return sock.sendMessage(chatId, {
                text: 'Reply to audio or video!'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '🎤',
                key: message.key
            }
        });

        const qmsg = quoted.quotedMessage;

        let stream;
        let ext = 'mp3';

        // Audio
        if (qmsg.audioMessage) {

            stream = await downloadContentFromMessage(
                qmsg.audioMessage,
                'audio'
            );

            ext = 'mp3';

        }

        // Video
        else if (qmsg.videoMessage) {

            stream = await downloadContentFromMessage(
                qmsg.videoMessage,
                'video'
            );

            ext = 'mp4';

        }

        else {

            return sock.sendMessage(chatId, {
                text: 'Reply to audio or video!'
            }, { quoted: message });

        }

        // Buffer build
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Convert to WhatsApp voice
        const voiceBuffer = await toPTT(buffer, ext);

        // Send voice note
        await sock.sendMessage(chatId, {
            audio: voiceBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (e) {

        console.error(e);

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

    }
}

module.exports = tovnCommand;

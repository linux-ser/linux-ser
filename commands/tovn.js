const { toPTT } = require('../lib/converter');

async function tovnCommand(sock, chatId, message) {

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
        return sock.sendMessage(chatId, {
            text: 'Reply to audio or video!'
        }, { quoted: message });
    }

    try {

        await sock.sendMessage(chatId, {
            react: {
                text: '🎤',
                key: message.key
            }
        });

        let mediaMessage;
        let ext = 'mp3';

        // Audio
        if (quoted.audioMessage) {

            mediaMessage = {
                message: {
                    audioMessage: quoted.audioMessage
                }
            };

            ext = 'mp3';

        }

        // Video
        else if (quoted.videoMessage) {

            mediaMessage = {
                message: {
                    videoMessage: quoted.videoMessage
                }
            };

            ext = 'mp4';

        }

        else {

            return sock.sendMessage(chatId, {
                text: 'Reply to audio or video!'
            }, { quoted: message });

        }

        // Download media
        const buffer = await sock.downloadMediaMessage(mediaMessage);

        // Convert to WhatsApp Voice Note
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

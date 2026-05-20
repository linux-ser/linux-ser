const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const { toPTT } = require('./converter'); // adjust path if needed

async function ttsCommand(sock, chatId, text, message, language = 'en') {

    const react = async (emoji) => {
        await sock.sendMessage(chatId, {
            react: {
                text: emoji,
                key: message.key
            }
        });
    };

    if (!text) {
        return sock.sendMessage(chatId, {
            text: 'Please provide text!'
        }, { quoted: message });
    }

    const tempFile = path.join(__dirname, `../assets/tts-${Date.now()}.mp3`);

    try {

        await react('🎤');

        const gtts = new gTTS(text, language);

        gtts.save(tempFile, async function (err) {

            if (err) {
                console.error(err);
                await react('❌');
                return;
            }

            try {

                // Read MP3 file
                const audioBuffer = fs.readFileSync(tempFile);

                // Convert MP3 → WhatsApp Voice Note (OPUS/PTT)
                const voiceBuffer = await toPTT(audioBuffer, 'mp3');

                // Send as WhatsApp Voice Note
                await sock.sendMessage(chatId, {
                    audio: voiceBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: message });

                await react('✅');

            } catch (e) {
                console.error(e);
                await react('❌');
            }

            // Cleanup
            setTimeout(() => {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }, 5000);

        });

    } catch (error) {
        console.error(error);
        await react('❌');
    }
}

module.exports = ttsCommand;

const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

async function ttsCommand(sock, chatId, text, message, language = 'en') {
    // Helper for reactions
    const react = async (emoji) => {
        await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });
    };

    if (!text) {
        return sock.sendMessage(chatId, { text: 'Please provide text!' }, { quoted: message });
    }

    // Define temporary file path
    const tempFile = path.join(__dirname, `../assets/tts-${Date.now()}.mp3`);

    try {
        await react('🎤');

        const gtts = new gTTS(text, language);

        // 1. Save TTS as MP3
        gtts.save(tempFile, async function (err) {
            if (err) {
                await react('❌');
                console.error(err);
                return;
            }

            // 2. Send as a normal Audio file (Playable)
            await sock.sendMessage(chatId, {
                audio: { url: tempFile },
                mimetype: 'audio/mpeg',
                ptt: false // This sends it as a standard audio player
            }, { quoted: message });

            await react('✅');

            // 3. Cleanup: Delete temp file after sending
            setTimeout(() => {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            }, 5000); // Small delay to ensure the file is uploaded
        });

    } catch (error) {
        console.error(error);
        await react('❌');
    }
}

module.exports = ttsCommand;

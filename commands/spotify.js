const axios = require('axios');

async function spotifyCommand(sock, chatId, message) {
    try {
        const rawText =
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const args = rawText.split(/\s+/);
        args.shift();

        const spotifyUrl = args.join(' ').trim();

        // No URL
        if (!spotifyUrl) {
            return await sock.sendMessage(chatId, {
                text:
`⚠️ Please provide a Spotify track link.

📌 Example:
.spotify https://open.spotify.com/track/xxxx`
            }, { quoted: message });
        }

        // Validate Spotify link
        if (!spotifyUrl.includes('open.spotify.com/track/')) {
            return await sock.sendMessage(chatId, {
                text: '❌ Invalid Spotify track link.'
            }, { quoted: message });
        }

        // React loading
        await sock.sendMessage(chatId, {
            react: {
                text: '⏳',
                key: message.key
            }
        });

        // WORKING API
        const apiUrl =
            `https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(spotifyUrl)}`;

        const response = await axios.get(apiUrl, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const data = response.data;

        // Debug log
        console.log(data);

        // Result
        const result =
            data.data ||
            data.result ||
            data;

        if (!result) {
            throw new Error('No result');
        }

        const title =
            result.title ||
            result.name ||
            'Unknown';

        const artist =
            result.artist ||
            result.artists ||
            'Unknown';

        const thumbnail =
            result.thumbnail ||
            result.cover ||
            result.image;

        const audioUrl =
            result.download ||
            result.url ||
            result.audio ||
            result.downloadUrl;

        if (!audioUrl) {
            throw new Error('No audio URL found');
        }

        // React music
        await sock.sendMessage(chatId, {
            react: {
                text: '🎵',
                key: message.key
            }
        });

        // Send thumbnail
        if (thumbnail) {
            await sock.sendMessage(chatId, {
                image: { url: thumbnail },
                caption:
`🎧 *SPOTIFY DOWNLOADER*

🎵 Title: ${title}
👤 Artist: ${artist}

⬇️ Downloading audio...`
            }, { quoted: message });
        }

        // Download audio buffer
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*'
            }
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        if (!audioBuffer || audioBuffer.length < 1000) {
            throw new Error('Invalid audio buffer');
        }

        // Send audio
        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[\\/:*?"<>|]/g, '')}.mp3`,
            ptt: false
        }, { quoted: message });

        // Success react
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (error) {
        console.log('[SPOTIFY ERROR]', error?.response?.data || error.message);

        // Error react
        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        await sock.sendMessage(chatId, {
            text:
`❌ Spotify download failed.

⚠️ API server down or song unavailable.`
        }, { quoted: message });
    }
}

module.exports = spotifyCommand;

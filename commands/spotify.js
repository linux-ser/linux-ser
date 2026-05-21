const axios = require('axios');

async function spotifyCommand(
    sock,
    chatId,
    message
) {

    try {

        // ======================
        // GET MESSAGE
        // ======================

        const text =
        message.message?.conversation ||

        message.message?.extendedTextMessage?.text ||

        '';

        // ======================
        // GET URL
        // ======================

        const args =
        text.trim().split(/\s+/);

        const spotifyUrl =
        args[1];

        // ======================
        // USAGE MESSAGE
        // ======================

        if (!spotifyUrl) {

            await sock.sendMessage(chatId, {

                react: {
                    text: '🎵',
                    key: message.key
                }

            });

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🎧 Spotify Downloader 〕━━━╮
┃ ✦ Please provide
┃ ✦ a Spotify track link
┃
┃ ✦ Example:
┃ ✦ .spotify https://open.spotify.com/track/xxxx
╰━━━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // LOADING REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '🎶',
                key: message.key
            }

        });

        // ======================
        // LOADING MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 🎵 Downloading 〕━━━╮
┃ ✦ Fetching Spotify song
┃ ✦ Please wait...
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

        // ======================
        // API REQUEST
        // ======================

        const api =
`https://api.spotifydownloader.pro/download/${encodeURIComponent(spotifyUrl)}`;

        const response =
        await axios.get(api, {

            headers: {
                'User-Agent':
                'Mozilla/5.0'
            }

        });

        // ======================
        // DATA
        // ======================

        const data =
        response.data;

        if (
            !data ||
            !data.download
        ) {

            throw new Error(
                'No download link'
            );

        }

        const title =
        data.title ||
        'Spotify Song';

        const artist =
        data.artist ||
        'Unknown Artist';

        const thumbnail =
        data.cover ||

'https://i.imgur.com/8wKQZ5F.jpeg';

        const downloadUrl =
        data.download;

        // ======================
        // SEND AUDIO
        // ======================

        await sock.sendMessage(chatId, {

            audio: {
                url: downloadUrl
            },

            mimetype:
            'audio/mpeg',

            fileName:
            `${title}.mp3`,

            contextInfo: {

                externalAdReply: {

                    showAdAttribution: false,

                    title:
                    title,

                    body:
                    artist,

                    mediaType: 1,

                    renderLargerThumbnail: true,

                    thumbnailUrl:
                    thumbnail

                }

            }

        }, { quoted: message });

        // ======================
        // SUCCESS REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '✅',
                key: message.key
            }

        });

    } catch (error) {

        console.log(
            'Spotify Error:',
            error.response?.data || error
        );

        // ======================
        // ERROR REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '❌',
                key: message.key
            }

        });

        // ======================
        // ERROR MESSAGE
        // ======================

        return await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Spotify Error 〕━━━╮
┃ ✦ Failed to download song
┃ ✦ Invalid Spotify link
┃ ✦ or server offline
┃
┃ ✦ Try another song later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = spotifyCommand;

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

        const apiUrl =

`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(spotifyUrl)}`;

        const response =
        await axios.get(apiUrl);

        // ======================
        // CHECK RESPONSE
        // ======================

        if (
            !response.data ||
            !response.data.result
        ) {

            throw new Error(
                'Invalid API response'
            );

        }

        const data =
        response.data.result;

        const title =
        data.title || 'Unknown';

        const artist =
        data.artist || 'Unknown';

        const thumbnail =
        data.image;

        const downloadUrl =
        data.download_url;

        if (!downloadUrl) {

            throw new Error(
                'No download URL'
            );

        }

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
            error
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
┃ ✦ Download failed
┃ ✦ Song unavailable or
┃ ✦ API server offline
┃
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = spotifyCommand;

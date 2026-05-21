const axios = require('axios');
const yts = require('yt-search');

async function spotifyCommand(
    sock,
    chatId,
    message
) {

    try {

        // ======================
        // GET MESSAGE TEXT
        // ======================

        const text =
        message.message?.conversation ||

        message.message?.extendedTextMessage?.text ||

        '';

        // ======================
        // GET SPOTIFY URL
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
        // GET SPOTIFY DATA
        // ======================

        const spotifyData =
        await axios.get(

`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(spotifyUrl)}`

        );

        // ======================
        // CHECK DATA
        // ======================

        if (
            !spotifyData.data ||
            !spotifyData.data.result
        ) {

            throw new Error(
                'Spotify API failed'
            );

        }

        const data =
        spotifyData.data.result;

        const title =
        data.title || 'Unknown';

        const artist =
        data.artist || 'Unknown';

        const thumbnail =
        data.image ||

'https://i.imgur.com/8wKQZ5F.jpeg';

        // ======================
        // SEARCH YOUTUBE
        // ======================

        const search =
        await yts(
            `${title} ${artist}`
        );

        // ======================
        // CHECK VIDEO
        // ======================

        if (
            !search.videos.length
        ) {

            throw new Error(
                'No YouTube results'
            );

        }

        const video =
        search.videos[0];

        // ======================
        // MP3 URL
        // ======================

        const mp3Url =
`https://api.vevioz.com/api/button/mp3/${video.videoId}`;

        // ======================
        // SEND AUDIO
        // ======================

        await sock.sendMessage(chatId, {

            audio: {
                url: mp3Url
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
┃ ✦ Failed to download song
┃ ✦ Invalid Spotify link
┃ ✦ or server offline
┃
┃ ✦ Try again later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = spotifyCommand;

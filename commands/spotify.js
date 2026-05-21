const axios = require('axios');

async function spotifyCommand(
    sock,
    chatId,
    message
) {

    try {

        // ======================
        // GET TEXT
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
        // USAGE
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
        // LOADING
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '🎶',
                key: message.key
            }

        });

        // ======================
        // API REQUEST
        // ======================

        const response =
        await axios.get(

'https://spotify-downloader9.p.rapidapi.com/downloadSong',

        {

            params: {
                songId: spotifyUrl
            },

            headers: {

                'x-rapidapi-key':
'022183ec85mshe1541adfddfee03p1c683cjsn8414fc91bc36',

                'x-rapidapi-host':
'spotify-downloader9.p.rapidapi.com'

            }

        });

        // ======================
        // DATA
        // ======================

        const data =
        response.data;

        if (
            !data ||
            !data.data
        ) {

            throw new Error(
                'No result'
            );

        }

        const result =
        data.data;

        const title =
        result.title ||
        'Spotify Song';

        const artist =
        result.artist ||
        'Unknown Artist';

        const downloadUrl =
        result.downloadLink;

        const thumbnail =
        result.cover ||
'https://i.imgur.com/8wKQZ5F.jpeg';

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
        // SUCCESS
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

        await sock.sendMessage(chatId, {

            react: {
                text: '❌',
                key: message.key
            }

        });

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Spotify Error 〕━━━╮
┃ ✦ Download failed
┃ ✦ Invalid link or
┃ ✦ API limit reached
┃
┃ ✦ Try again later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = spotifyCommand;

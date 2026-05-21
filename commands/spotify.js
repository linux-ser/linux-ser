const axios = require('axios');

async function spotifyCommand(
    sock,
    chatId,
    message
) {

    try {

        const text =
        message.message?.conversation ||

        message.message?.extendedTextMessage?.text ||

        '';

        const args =
        text.trim().split(/\s+/);

        const spotifyUrl =
        args[1];

        // ======================
        // USAGE
        // ======================

        if (!spotifyUrl) {

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
        // REACT
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

'https://download-all-in-one1.p.rapidapi.com/v1/social/autolink',

        {

            params: {
                url: spotifyUrl
            },

            headers: {

                'x-rapidapi-key':
'022183ec85mshe1541adfddfee03p1c683cjsn8414fc91bc36',

                'x-rapidapi-host':
'download-all-in-one1.p.rapidapi.com'

            }

        });

        console.log(
            response.data
        );

        // ======================
        // DATA
        // ======================

        const data =
        response.data;

        if (
            !data ||
            !data.medias ||
            !data.medias.length
        ) {

            throw new Error(
                'No audio found'
            );

        }

        // ======================
        // GET AUDIO
        // ======================

        const audio =
        data.medias.find(
            v => v.type === 'audio'
        ) || data.medias[0];

        const downloadUrl =
        audio.url;

        const title =
        data.title ||
        'Spotify Song';

        const thumbnail =
        data.thumbnail ||

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
                    'Spotify Downloader',

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

        await sock.sendMessage(chatId, {

            react: {
                text: '❌',
                key: message.key
            }

        });

        return await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Spotify Error 〕━━━╮
┃ ✦ Download failed
┃ ✦ API issue or invalid link
┃
┃ ✦ Try another song
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = spotifyCommand;

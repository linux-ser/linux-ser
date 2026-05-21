const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

// ======================
// TEMP CACHE
// ======================

global.musicDetectCache =
global.musicDetectCache || {};

// ======================
// MUSIC DETECTOR COMMAND
// ======================

async function musicDetectCommand(
    sock,
    chatId,
    message,
    sender
) {

    try {

        // ======================
        // REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '🎵',
                key: message.key
            }

        });

        // ======================
        // GET QUOTED MESSAGE
        // ======================

        const quoted =

            message.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage;

        if (!quoted) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🎵 Music Detector 〕━━━╮
┃ ✦ Reply to audio,
┃ ✦ video or voice
┃ ✦ message
┃
┃ 📌 Example:
┃ ✦ Reply media + .music
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // CHECK MEDIA
        // ======================

        const media =

            quoted.audioMessage ||

            quoted.videoMessage;

        if (!media) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 ❌ Invalid Media 〕━━━╮
┃ ✦ Reply to audio,
┃ ✦ video or voice
┃ ✦ message
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // SEARCH REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '🔎',
                key: message.key
            }

        });

        // ======================
        // DOWNLOAD MEDIA
        // ======================

        const type =

            quoted.audioMessage
                ? 'audio'
                : 'video';

        const stream =

        await downloadContentFromMessage(
            media,
            type
        );

        let buffer =
        Buffer.from([]);

        for await (
            const chunk of stream
        ) {

            buffer =
            Buffer.concat([
                buffer,
                chunk
            ]);

        }

        // ======================
        // SAVE FILE
        // ======================

        const fileName =
`music_${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`;

        fs.writeFileSync(
            fileName,
            buffer
        );

        // ======================
        // FORM DATA
        // ======================

        const form =
        new FormData();

        form.append(
            'file',
            fs.createReadStream(fileName)
        );

        // ======================
        // TRACE API
        // ======================

        const response =
        await axios.post(

'https://api.trace.moe/search',

            form,

            {
                headers:
                form.getHeaders()
            }

        );

        // ======================
        // RESULT CHECK
        // ======================

        if (

            !response.data ||
            !response.data.result ||
            !response.data.result.length

        ) {

            throw new Error(
                'No result'
            );

        }

        const result =
        response.data.result[0];

        // ======================
        // GET ANIME INFO
        // ======================

        let movieName =
        'Unknown';

        let releaseYear =
        'Unknown';

        let genres =
        'Unknown';

        let score =
        'Unknown';

        let status =
        'Unknown';

        let animeUrl =
        'Unavailable';

        try {

            const aniResponse =
            await axios({

                url:
'https://graphql.anilist.co',

                method:
'POST',

                headers: {

                    'Content-Type':
'application/json',

                    'Accept':
'application/json'

                },

                data: {

                    query: `
query ($id: Int) {
Media(id: $id, type: ANIME) {
title {
romaji
english
native
}
startDate {
year
}
siteUrl
genres
averageScore
status
}
}
`,

                    variables: {
                        id: result.anilist
                    }

                }

            });

            const mediaInfo =

                aniResponse.data
                ?.data
                ?.Media;

            movieName =

                mediaInfo?.title?.english ||

                mediaInfo?.title?.romaji ||

                'Unknown';

            releaseYear =
            mediaInfo?.startDate?.year ||
            'Unknown';

            genres =
            mediaInfo?.genres?.join(', ') ||
            'Unknown';

            score =
            mediaInfo?.averageScore ||
            'Unknown';

            status =
            mediaInfo?.status ||
            'Unknown';

            animeUrl =
            mediaInfo?.siteUrl ||
            'Unavailable';

        }

        catch (e) {

            console.log(e);

        }

        // ======================
        // YOUTUBE SEARCH
        // ======================

        const ytSearch =
        await yts(movieName);

        const ytVideo =
        ytSearch.videos[0];

        const youtubeUrl =
        ytVideo?.url ||
        'Unavailable';

        // ======================
        // SPOTIFY SEARCH
        // ======================

        const spotifyUrl =
`https://open.spotify.com/search/${encodeURIComponent(movieName)}`;

        // ======================
        // SAVE CACHE
        // ======================

        global.musicDetectCache[sender] = {

            title:
            movieName,

            youtube:
            youtubeUrl,

            image:
            result.image,

            artist:
            movieName,

            album:
            movieName

        };

        // ======================
        // RESULT MESSAGE
        // ======================

        const caption =

`╭━━━〔 🎵 Music Detected 〕━━━╮
┃ 🎶 Song / Anime:
┃ ✦ ${movieName}
┃
┃ 📅 Release Year:
┃ ✦ ${releaseYear}
┃
┃ 🎭 Genres:
┃ ✦ ${genres}
┃
┃ ⭐ Rating:
┃ ✦ ${score}
┃
┃ 📊 Match:
┃ ✦ ${(result.similarity * 100).toFixed(2)}%
┃
┃ 📌 Status:
┃ ✦ ${status}
┃
┃ 🎬 Episode:
┃ ✦ ${result.episode || 'Unknown'}
┃
┃ ▶️ YouTube:
┃ ✦ ${youtubeUrl}
┃
┃ 🎧 Spotify:
┃ ✦ ${spotifyUrl}
┃
┃ 🌐 Anime Info:
┃ ✦ ${animeUrl}
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎧 Download Audio? 〕━━━╮
┃ ✦ Reply with:
┃ ✦ yes
┃ ✦ no
╰━━━━━━━━━━━━━━━━━━╯

> Powered By 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        // ======================
        // SEND RESULT
        // ======================

        await sock.sendMessage(chatId, {

            image: {
                url: result.image
            },

            caption:
            caption

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

    }

    catch (error) {

        console.log(error);

        await sock.sendMessage(chatId, {

            react: {
                text: '❌',
                key: message.key
            }

        });

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Music Detect Error 〕━━━╮
┃ ✦ Failed to detect
┃ ✦ music
┃
┃ ✦ Try another media
╰━━━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

// ======================
// YES / NO HANDLER
// ======================

async function handleMusicReply(
    sock,
    chatId,
    message,
    sender,
    text
) {

    try {

        const data =
        global.musicDetectCache[sender];

        if (!data) return;

        // ======================
        // NO
        // ======================

        if (
            text.toLowerCase() === 'no'
        ) {

            delete global.musicDetectCache[sender];

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🎵 Audio Skipped 〕━━━╮
┃ ✦ Audio download
┃ ✦ cancelled
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // YES
        // ======================

        if (
            text.toLowerCase() === 'yes'
        ) {

            await sock.sendMessage(chatId, {

                react: {
                    text: '⬇️',
                    key: message.key
                }

            });

            // ======================
            // AUDIO INFO MESSAGE
            // ======================

            await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🎧 Downloading Audio 〕━━━╮
┃ 🎶 Title:
┃ ✦ ${data.title}
┃
┃ 👤 Artist:
┃ ✦ ${data.artist}
┃
┃ 💽 Album:
┃ ✦ ${data.album}
┃
┃ 📁 File Name:
┃ ✦ ${data.title}.mp3
┃
┃ 🖼 Cover:
┃ ✦ Available
┃
┃ 📥 Status:
┃ ✦ Downloading...
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

            // ======================
            // AUDIO STREAM
            // ======================

            const audioStream =
            ytdl(

                data.youtube,

                {
                    filter:
                    'audioonly'
                }

            );

            // ======================
            // SEND AUDIO
            // ======================

            await sock.sendMessage(chatId, {

                audio:
                audioStream,

                mimetype:
                'audio/mpeg',

                fileName:
`${data.title}.mp3`,

                contextInfo: {

                    externalAdReply: {

                        title:
                        data.title,

                        body:
`Artist: ${data.artist}`,

                        mediaType:
                        1,

                        previewType:
                        0,

                        thumbnailUrl:
                        data.image,

                        renderLargerThumbnail:
                        true,

                        sourceUrl:
                        data.youtube

                    }

                }

            }, { quoted: message });

            delete global.musicDetectCache[sender];

            // ======================
            // SUCCESS REACTION
            // ======================

            await sock.sendMessage(chatId, {

                react: {
                    text: '✅',
                    key: message.key
                }

            });

        }

    }

    catch (e) {

        console.log(e);

    }

}

module.exports = {

    musicDetectCommand,
    handleMusicReply

};

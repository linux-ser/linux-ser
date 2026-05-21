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
// MUSIC DETECTOR
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
        // GET QUOTED
        // ======================

        const context =

            message.message
            ?.extendedTextMessage
            ?.contextInfo;

        if (!context?.quotedMessage) {

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

        const quoted =
        context.quotedMessage;

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

        const filePath =
`./temp_${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`;

        fs.writeFileSync(
            filePath,
            buffer
        );

        // ======================
        // UPLOAD TO AUDD.IO
        // ======================

        const form =
        new FormData();

        form.append(
            'file',
            fs.createReadStream(filePath)
        );

        form.append(
            'return',
            'spotify,apple_music'
        );

        form.append(
            'api_token',
            'test'
        );

        const response =
        await axios.post(

'https://api.audd.io/',

            form,

            {
                headers:
                form.getHeaders()
            }

        );

        // ======================
        // DELETE TEMP FILE
        // ======================

        fs.unlinkSync(
            filePath
        );

        // ======================
        // RESULT CHECK
        // ======================

        if (
            !response.data.result
        ) {

            throw new Error(
                'Song not found'
            );

        }

        const result =
        response.data.result;

        // ======================
        // DETAILS
        // ======================

        const title =
        result.title || 'Unknown';

        const artist =
        result.artist || 'Unknown';

        const album =
        result.album || 'Unknown';

        const release =
        result.release_date || 'Unknown';

        const spotify =
        result.spotify?.external_urls?.spotify ||
        'Unavailable';

        const apple =
        result.apple_music?.url ||
        'Unavailable';

        const cover =
        result.spotify?.album?.images?.[0]?.url ||
        'https://i.imgur.com/KnOxv0C.jpeg';

        // ======================
        // SEARCH YOUTUBE
        // ======================

        const ytResult =
        await yts(

`${title} ${artist}`

        );

        const ytVideo =
        ytResult.videos[0];

        const youtube =
        ytVideo?.url ||
        'Unavailable';

        // ======================
        // SAVE CACHE
        // ======================

        global.musicDetectCache[sender] = {

            title,
            artist,
            album,
            cover,
            youtube

        };

        // ======================
        // RESULT MESSAGE
        // ======================

        const caption =

`╭━━━〔 🎵 Song Detected 〕━━━╮
┃ 🎶 Title:
┃ ✦ ${title}
┃
┃ 👤 Artist:
┃ ✦ ${artist}
┃
┃ 💽 Album:
┃ ✦ ${album}
┃
┃ 📅 Release:
┃ ✦ ${release}
┃
┃ ▶️ YouTube:
┃ ✦ ${youtube}
┃
┃ 🎧 Spotify:
┃ ✦ ${spotify}
┃
┃ 🍎 Apple Music:
┃ ✦ ${apple}
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎧 Download Audio? 〕━━━╮
┃ ✦ Reply:
┃ ✦ yes
┃ ✦ no
╰━━━━━━━━━━━━━━━━━━╯

> Powered By 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        // ======================
        // SEND RESULT
        // ======================

        await sock.sendMessage(chatId, {

            image: {
                url: cover
            },

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

    catch (e) {

        console.log(e);

        await sock.sendMessage(chatId, {

            react: {
                text: '❌',
                key: message.key
            }

        });

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Detection Failed 〕━━━╮
┃ ✦ Song not found
┃ ✦ or API failed
╰━━━━━━━━━━━━━━━━━━╯`

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
┃ ✦ Download cancelled
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
            // INFO MESSAGE
            // ======================

            await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🎧 Downloading 〕━━━╮
┃ 🎶 ${data.title}
┃ 👤 ${data.artist}
┃ 💽 ${data.album}
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

            // ======================
            // GET AUDIO
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
`${data.artist}`,

                        mediaType:
                        1,

                        previewType:
                        0,

                        thumbnailUrl:
                        data.cover,

                        renderLargerThumbnail:
                        true,

                        sourceUrl:
                        data.youtube

                    }

                }

            }, { quoted: message });

            delete global.musicDetectCache[sender];

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

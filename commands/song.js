const axios = require('axios');
const yts = require('yt-search');

async function songCommand(sock, chatId, message, args = []) {

    try {

        let query = args.join(' ').trim();

        if (!query) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🎵 Song Downloader 〕━━━╮
┃ ✦ Please provide a song name
┃
┃ 📌 Example:
┃ ✦ .song faded
┃ ✦ .song believer
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        // SEARCH
        const search = await yts(query);

        if (!search.videos.length) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Song Not Found 〕━━━╮
┃ ✦ No matching songs found
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        const video = search.videos[0];

        // DETAILS
        await sock.sendMessage(chatId, {

            image: {
                url: video.thumbnail
            },

            caption:
`╭━━━〔 🎵 Audio Details 〕━━━╮
┃ ✦ 🎧 ${video.title}
┃ ✦ 🎤 ${video.author.name}
┃ ✦ ⏱ ${video.timestamp}
┃
┃ ✦ Downloading audio...
╰━━━━━━━━━━━━━━━━━━╯`

        }, {
            quoted: message
        });

        // API
        const api =
`https://widipe.com/download/ytmp3?url=${encodeURIComponent(video.url)}`;

        const res = await axios.get(api);

        if (
            !res.data ||
            !res.data.result ||
            !res.data.result.download
        ) {

            throw new Error('Download failed');
        }

        const audioUrl =
            res.data.result.download;

        // AUDIO BUFFER
        const audioRes =
            await axios.get(audioUrl, {
                responseType:
                    'arraybuffer'
            });

        const audioBuffer =
            Buffer.from(audioRes.data);

        // THUMBNAIL
        const thumb =
            await axios.get(
                video.thumbnail,
                {
                    responseType:
                        'arraybuffer'
                }
            );

        // SEND AUDIO
        await sock.sendMessage(chatId, {

            audio: audioBuffer,

            mimetype:
                'audio/mpeg',

            fileName:
`${video.title}.mp3`,

            ptt: false,

            title:
                video.title,

            performer:
                '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',

            jpegThumbnail:
                Buffer.from(
                    thumb.data
                )

        }, {
            quoted: message
        });

        // SUCCESS
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (err) {

        console.log(err);

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Unable to download audio
┃ ✦ Try another song later
╰━━━━━━━━━━━━━━━━━━╯`
        }, {
            quoted: message
        });
    }
}

module.exports = songCommand;

const yts = require('yt-search');
const axios = require('axios');

async function playCommand(sock, chatId, message) {

    try {

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text;

        const searchQuery =
            text.split(' ').slice(1).join(' ').trim();

        // NO QUERY
        if (!searchQuery) {

            await sock.sendMessage(chatId, {
                react: {
                    text: "⚠️",
                    key: message.key,
                },
            });

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🎵 Play Downloader 〕━━━╮
┃ ✦ Please provide
┃ ✦ a song name
┃
┃ 📌 Example:
┃ ✦ .play faded
┃ ✦ .play believer
┃ ✦ .play alone
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        // SEARCH REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: "🔎",
                key: message.key,
            },
        });

        // SEARCH SONG
        const { videos } = await yts(searchQuery);

        if (!videos || videos.length === 0) {

            await sock.sendMessage(chatId, {
                react: {
                    text: "❌",
                    key: message.key,
                },
            });

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Song Not Found 〕━━━╮
┃ ✦ No matching songs found
┃ ✦ Try another song name
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        // FIRST RESULT
        const video = videos[0];

        const title = video.title;
        const artist = video.author.name;
        const duration = video.timestamp;
        const views = video.views;
        const thumbnail = video.thumbnail;
        const urlYt = video.url;

        // CUSTOM AUDIO METADATA
        const customTitle = "♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ";
        const customArtist = "𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️";
        const customAlbum = "𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️";

        // CUSTOM COVER IMAGE
        const customThumbnail =
"https://i.imgur.com/yourimage.jpg";

        // LOADING
        await sock.sendMessage(chatId, {
            react: {
                text: "⬇️",
                key: message.key,
            },
        });

        // AUDIO API
        const response = await axios.get(
            `https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`
        );

        const data = response.data;

        if (
            !data ||
            !data.status ||
            !data.result ||
            !data.result.downloadUrl
        ) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Failed to fetch audio
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        const audioUrl = data.result.downloadUrl;

        // REAL SONG DETAILS MESSAGE
        await sock.sendMessage(chatId, {
            image: { url: thumbnail },
            caption:
`╭━━━〔 🎵 Audio Details 〕━━━╮
┃ ✦ 🎧 Title:
┃ ✦ ${title}
┃
┃ ✦ 🎤 Artist:
┃ ✦ ${artist}
┃
┃ ✦ 💿 Album:
┃ ✦ YouTube Music
┃
┃ ✦ ⏱ Duration:
┃ ✦ ${duration}
┃
┃ ✦ 👁 Views:
┃ ✦ ${views}
╰━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });

        // SEND AUDIO
        await sock.sendMessage(
            chatId,
            {
                audio: { url: audioUrl },

                mimetype: "audio/mp4",

                ptt: false,

                fileName: "linuxser.mp3",

                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,

                        title: customTitle,

                        body:
`🎤 ${customArtist}`,

                        mediaType: 1,

                        thumbnailUrl: customThumbnail,

                        renderLargerThumbnail: true,

                        sourceUrl: urlYt,
                    },
                },

                seconds: video.seconds || 180,

                waveform: [
                    100, 0, 100, 0, 100,
                    0, 100, 0, 100
                ],

                title: customTitle,

                jpegThumbnail: Buffer.from(
                    await (
                        await axios.get(customThumbnail, {
                            responseType: "arraybuffer"
                        })
                    ).data
                ),
            },
            { quoted: message }
        );

        // SUCCESS REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: "🎉",
                key: message.key,
            },
        });

    } catch (error) {

        console.error('PLAY ERROR:', error);

        await sock.sendMessage(chatId, {
            react: {
                text: "❌",
                key: message.key,
            },
        });

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ⚠️ System Error 〕━━━╮
┃ ✦ Failed to process request
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });
    }
}

module.exports = playCommand;

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');
const { Innertube } = require('youtubei.js');

async function songCommand(sock, chatId, message, args = []) {

    try {

        await sock.sendMessage(chatId, {
            react: {
                text: '🎵',
                key: message.key
            }
        });

        let query = '';

        if (args.length > 0) {

            query = args.join(' ').trim();

        } else {

            const text =
                message.message?.conversation ||
                message.message?.extendedTextMessage?.text ||
                '';

            query = text
                .replace(/^\.song\s*/i, '')
                .trim();
        }

        // EMPTY QUERY
        if (!query) {

            await sock.sendMessage(chatId, {
                react: {
                    text: '⚠️',
                    key: message.key
                }
            });

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

        // SEARCH SONG
        await sock.sendMessage(chatId, {
            react: {
                text: '🔍',
                key: message.key
            }
        });

        const search = await yts(query);

        if (!search.videos.length) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Song Not Found 〕━━━╮
┃ ✦ No matching songs found
┃ ✦ Try another keyword
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
┃ ✦ 🎧 Title: ${video.title}
┃
┃ ✦ 🎤 Artist: ${video.author.name}
┃
┃ ✦ ⏱ Duration: ${video.timestamp}
┃
┃ ✦ 🔍 Status: Downloading Audio...
╰━━━━━━━━━━━━━━━━━━╯`

        }, {
            quoted: message
        });

        // DOWNLOAD REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: '⬇️',
                key: message.key
            }
        });

        // YOUTUBE DOWNLOAD
        const youtube = await Innertube.create();

        const info =
            await youtube.getBasicInfo(video.videoId);

        const stream =
            await youtube.download(video.videoId, {
                type: 'audio',
                quality: 'best'
            });

        const filePath =
            path.join(
                __dirname,
                `${Date.now()}.mp3`
            );

        const writeStream =
            fs.createWriteStream(filePath);

        for await (const chunk of stream) {

            writeStream.write(chunk);
        }

        writeStream.end();

        await new Promise(resolve =>
            writeStream.on('finish', resolve)
        );

        // CUSTOM INFO
        const customArtist =
            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

        const customThumbnail =
'https://o.uguu.se/kYrlzKnK.jpg';

        // SEND AUDIO
        await sock.sendMessage(chatId, {

            audio:
                fs.readFileSync(filePath),

            mimetype:
                'audio/mpeg',

            ptt: false,

            fileName:
`${video.title}.mp3`,

            title:
                video.title,

            performer:
                customArtist,

            seconds:
                video.seconds,

            jpegThumbnail:
                Buffer.from(
                    await (
                        await axios.get(
                            customThumbnail,
                            {
                                responseType:
                                    'arraybuffer'
                            }
                        )
                    ).data
                ),

            contextInfo: {
                externalAdReply: {

                    showAdAttribution:
                        false,

                    title:
                        video.title,

                    body:
                        `🎤 ${customArtist}`,

                    mediaType: 1,

                    renderLargerThumbnail:
                        true,

                    thumbnailUrl:
                        customThumbnail,

                    sourceUrl:
                        video.url
                }
            }

        }, {
            quoted: message
        });

        // DELETE FILE
        fs.unlinkSync(filePath);

        // SUCCESS
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (err) {

        console.error(err);

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Unable to download audio
┃ ✦ Try again later
╰━━━━━━━━━━━━━━━━━━╯`
        }, {
            quoted: message
        });
    }
}

module.exports = songCommand;

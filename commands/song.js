const axios = require('axios');
const yts = require('yt-search');

async function songCommand(sock, chatId, message, args = []) {

    try {

        // START REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: '🎵',
                key: message.key
            }
        });

        // ================= GET QUERY =================

        let text = '';

        if (Array.isArray(args) && args.length > 0) {

            text = args.join(' ').trim();

        } else {

            text =
                message.message?.conversation ||
                message.message?.extendedTextMessage?.text ||
                '';

            text = text
                .replace(/^\.song\s*/i, '')
                .trim();
        }

        // ================= EMPTY QUERY =================

        if (!text) {

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

        let video;

        // ================= URL / SEARCH =================

        if (
            text.includes('youtube.com') ||
            text.includes('youtu.be')
        ) {

            video = {
                url: text,
                title: 'YouTube Audio',
                thumbnail:
'https://i.imgur.com/7vQZ6oA.jpeg',
                timestamp: 'Unknown',
                seconds: 180,
                author: {
                    name: 'Unknown Artist'
                }
            };

        } else {

            // SEARCH REACTION
            await sock.sendMessage(chatId, {
                react: {
                    text: '🔍',
                    key: message.key
                }
            });

            const search = await yts(text);

            if (!search.videos.length) {

                await sock.sendMessage(chatId, {
                    react: {
                        text: '❌',
                        key: message.key
                    }
                });

                return await sock.sendMessage(chatId, {
                    text:
`╭━━━〔 ❌ Song Not Found 〕━━━╮
┃ ✦ No matching songs found
┃ ✦ Try another song name
╰━━━━━━━━━━━━━━━━━━╯`
                }, {
                    quoted: message
                });
            }

            video = search.videos[0];
        }

        // ================= DETAILS =================

        await sock.sendMessage(chatId, {

            image: {
                url: video.thumbnail
            },

            caption:
`╭━━━〔 🎵 Audio Details 〕━━━╮
┃ ✦ 🎧 Title: ${video.title}
┃
┃ ✦ 🎤 Artist: ${video.author?.name || 'Unknown Artist'}
┃
┃ ✦ 💿 Album: YouTube Music
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

        // ================= DOWNLOAD AUDIO =================

        const downloadApis = [

            `https://widipe.com/download/ytmp3?url=${encodeURIComponent(video.url)}`,

            `https://api.vevioz.com/api/button/mp3/${video.url}`

        ];

        let audioUrl = null;

        for (const api of downloadApis) {

            try {

                const res = await axios.get(api, {
                    timeout: 60000,
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0'
                    }
                });

                // WIDIPE
                if (
                    res.data &&
                    res.data.result &&
                    res.data.result.download
                ) {

                    audioUrl =
                        res.data.result.download;

                    break;
                }

                // VEVIOZ HTML SCRAPE
                if (typeof res.data === 'string') {

                    const match =
                        res.data.match(
/https?:\/\/[^"]+\.mp3/g
                        );

                    if (match && match[0]) {

                        audioUrl = match[0];
                        break;
                    }
                }

            } catch (e) {

                console.log(
                    'API failed:',
                    e.message
                );
            }
        }

        // ================= FAILED =================

        if (!audioUrl) {

            await sock.sendMessage(chatId, {
                react: {
                    text: '❌',
                    key: message.key
                }
            });

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Unable to fetch audio
┃ ✦ Try another song/link
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        // ================= CUSTOM METADATA =================

        const realTitle =
            video.title || 'Unknown Song';

        const customArtist =
            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

        const customThumbnail =
'https://i.imgur.com/7vQZ6oA.jpeg';

        // ================= SEND AUDIO =================

        await sock.sendMessage(chatId, {

            audio: {
                url: audioUrl
            },

            mimetype: 'audio/mpeg',

            ptt: false,

            fileName:
`${realTitle}.mp3`,

            title:
                realTitle,

            performer:
                customArtist,

            seconds:
                video.seconds || 180,

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
                        realTitle,

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

        // SUCCESS REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (err) {

        console.error(
            'Song command error:',
            err
        );

        // ERROR REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Failed to download song
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`
        }, {
            quoted: message
        });
    }
}

module.exports = songCommand;

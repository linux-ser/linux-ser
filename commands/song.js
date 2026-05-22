const axios = require('axios');
const yts = require('yt-search');

async function songCommand(sock, chatId, message, args = []) {

    try {

        // ================= START REACTION =================

        await sock.sendMessage(chatId, {
            react: {
                text: '🎵',
                key: message.key
            }
        });

        // ================= GET QUERY =================

        let text = '';

        if (
            Array.isArray(args) &&
            args.length > 0
        ) {

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

        // ================= SEARCH =================

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

            await sock.sendMessage(chatId, {
                react: {
                    text: '🔍',
                    key: message.key
                }
            });

            const search =
                await yts(text);

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
┃ ✦ 🎧 Title:
┃ ✦ ${video.title}
┃
┃ ✦ 🎤 Artist:
┃ ✦ ${video.author?.name || 'Unknown Artist'}
┃
┃ ✦ 💿 Album:
┃ ✦ YouTube Music
┃
┃ ✦ ⏱ Duration:
┃ ✦ ${video.timestamp}
┃
┃ ✦ 🔍 Status:
┃ ✦ Downloading Audio...
╰━━━━━━━━━━━━━━━━━━╯`

        }, {
            quoted: message
        });

        // ================= DOWNLOAD REACTION =================

        await sock.sendMessage(chatId, {
            react: {
                text: '⬇️',
                key: message.key
            }
        });

        // ================= DOWNLOAD AUDIO =================

        let audioBuffer = null;

        const downloadApis = [

            // API 1
            async () => {

                const res = await axios.get(
`https://widipe.com/download/ytmp3?url=${encodeURIComponent(video.url)}`,
                    {
                        timeout: 60000
                    }
                );

                if (
                    res.data &&
                    res.data.result &&
                    res.data.result.download
                ) {

                    return res.data.result.download;
                }

                return null;
            },

            // API 2
            async () => {

                const res = await axios.get(
`https://api.vevioz.com/api/button/mp3/${video.url}`,
                    {
                        timeout: 60000
                    }
                );

                if (typeof res.data === 'string') {

                    const match =
                        res.data.match(
/https?:\/\/[^"]+\.mp3/g
                        );

                    if (
                        match &&
                        match[0]
                    ) {

                        return match[0];
                    }
                }

                return null;
            }
        ];

        let audioUrl = null;

        // GET WORKING URL
        for (const api of downloadApis) {

            try {

                const result =
                    await api();

                if (result) {

                    audioUrl = result;
                    break;
                }

            } catch (e) {

                console.log(
                    'Download API failed:',
                    e.message
                );
            }
        }

        // FAILED
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
┃ ✦ Audio source unavailable
┃ ✦ Try another song later
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        // ================= FETCH AUDIO BUFFER =================

        try {

            const audioResponse =
                await axios.get(audioUrl, {
                    responseType:
                        'arraybuffer',

                    timeout: 120000,

                    headers: {
                        'User-Agent':
                            'Mozilla/5.0'
                    }
                });

            audioBuffer =
                Buffer.from(
                    audioResponse.data
                );

        } catch (e) {

            console.log(
                'Audio fetch failed:',
                e.message
            );

            await sock.sendMessage(chatId, {
                react: {
                    text: '❌',
                    key: message.key
                }
            });

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Audio Fetch Failed 〕━━━╮
┃ ✦ Unable to download audio
┃ ✦ Source server blocked
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        // ================= CUSTOM METADATA =================

        const realTitle =
            video.title ||
            'Unknown Song';

        const customArtist =
            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

        const customThumbnail =
'https://i.imgur.com/7vQZ6oA.jpeg';

        // ================= SEND AUDIO =================

        await sock.sendMessage(chatId, {

            audio: audioBuffer,

            mimetype:
                'audio/mpeg',

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

        // ================= SUCCESS =================

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

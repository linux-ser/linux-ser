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

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🎵 Song Downloader 〕━━━╮
┃ ✦ Please provide
┃ ✦ a song name or link
┃
┃ 📌 Example:
┃ ✦ .song faded
┃ ✦ .song believer
┃ ✦ .song https://youtu.be/xxxx
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

        // DOWNLOAD REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: '⬇️',
                key: message.key
            }
        });

        // ================= API FALLBACK =================

        let audioData;

        const apiMethods = [

            // API 1
            {
                name: 'Widipe',

                method: async () => {

                    const res = await axios.get(
`https://widipe.com/download/ytmp3?url=${encodeURIComponent(video.url)}`
                    );

                    if (
                        res.data &&
                        res.data.status &&
                        res.data.result &&
                        res.data.result.download
                    ) {

                        return {
                            download:
                                res.data.result.download
                        };
                    }

                    throw new Error('Widipe failed');
                }
            },

            // API 2
            {
                name: 'Nexoracle',

                method: async () => {

                    const res = await axios.get(
`https://api.nexoracle.com/downloader/youtube/audio?url=${encodeURIComponent(video.url)}`
                    );

                    if (
                        res.data &&
                        res.data.result &&
                        res.data.result.audio
                    ) {

                        return {
                            download:
                                res.data.result.audio
                        };
                    }

                    throw new Error('Nexoracle failed');
                }
            },

            // API 3
            {
                name: 'Lann',

                method: async () => {

                    const res = await axios.get(
`https://api.lannn.me/api/download/ytmp3?url=${encodeURIComponent(video.url)}`
                    );

                    if (
                        res.data &&
                        res.data.status &&
                        res.data.data &&
                        res.data.data.download
                    ) {

                        return {
                            download:
                                res.data.data.download
                        };
                    }

                    throw new Error('Lann failed');
                }
            }
        ];

        let success = false;

        for (const apiMethod of apiMethods) {

            try {

                audioData =
                    await apiMethod.method();

                if (
                    audioData &&
                    audioData.download
                ) {

                    success = true;
                    break;
                }

            } catch (err) {

                console.log(
`${apiMethod.name} failed:`,
                    err.message
                );
            }
        }

        // ================= FAILED =================

        if (!success) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Failed to download song
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`
            }, {
                quoted: message
            });
        }

        // ================= CUSTOM METADATA =================

        const customTitle =
            '♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ';

        const customArtist =
            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

        const customAlbum =
            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

        // CUSTOM COVER PIC
        const customThumbnail =
'https://i.imgur.com/7vQZ6oA.jpeg';

        // ================= SEND AUDIO =================

        await sock.sendMessage(chatId, {

            audio: {
                url: audioData.download
            },

            mimetype: 'audio/mpeg',

            ptt: false,

            fileName:
'linuxser.mp3',

            contextInfo: {
                externalAdReply: {

                    showAdAttribution:
                        false,

                    title:
                        customTitle,

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
            },

            title:
                customTitle,

            seconds:
                video.seconds || 180,

            waveform: [
                100, 0, 100, 0,
                100, 0, 100, 0
            ],

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
                )

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

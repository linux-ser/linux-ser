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

        // ================= API FALLBACK =================

        let audioData;

        const apiMethods = [

            // API 1
            {
                name: 'ApiHub',

                method: async () => {

                    const res = await axios.get(
`https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(video.url)}`,
                        {
                            timeout: 60000
                        }
                    );

                    if (
                        res.data &&
                        res.data.data &&
                        res.data.data.downloadUrl
                    ) {

                        return {
                            download:
                                res.data.data.downloadUrl
                        };
                    }

                    throw new Error('ApiHub failed');
                }
            },

            // API 2
            {
                name: 'BTCH',

                method: async () => {

                    const res = await axios.get(
`https://api.btch.bz.id/api/download/ytmp3?url=${encodeURIComponent(video.url)}`,
                        {
                            timeout: 60000
                        }
                    );

                    if (
                        res.data &&
                        res.data.result &&
                        res.data.result.mp3
                    ) {

                        return {
                            download:
                                res.data.result.mp3
                        };
                    }

                    throw new Error('BTCH failed');
                }
            },

            // API 3
            {
                name: 'DarkYasiya',

                method: async () => {

                    const res = await axios.get(
`https://dark-yasiya-api.onrender.com/download/ytmp3?url=${encodeURIComponent(video.url)}`,
                        {
                            timeout: 60000
                        }
                    );

                    if (
                        res.data &&
                        res.data.result &&
                        res.data.result.download
                    ) {

                        return {
                            download:
                                res.data.result.download
                        };
                    }

                    throw new Error('DarkYasiya failed');
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

            await sock.sendMessage(chatId, {
                react: {
                    text: '❌',
                    key: message.key
                }
            });

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

        const realTitle =
            video.title || 'Unknown Song';

        const customArtist =
            '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

        // COVER PIC PATH
        const customThumbnail =
'https://o.uguu.se/kYrlzKnK.jpg';

        // ================= SEND AUDIO =================

        await sock.sendMessage(chatId, {

            audio: {
                url: audioData.download
            },

            mimetype: 'audio/mpeg',

            ptt: false,

            // FILE NAME
            fileName:
`${realTitle}.mp3`,

            // AUDIO TITLE
            title:
                realTitle,

            // AUDIO ARTIST
            performer:
                customArtist,

            // AUDIO ALBUM
            caption:
                customArtist,

            seconds:
                video.seconds || 180,

            waveform: [
                100, 0, 100, 0,
                100, 0, 100, 0
            ],

            // AUDIO COVER PIC
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

            // WHATSAPP MUSIC CARD
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

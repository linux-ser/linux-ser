const ytdl = require("@distube/ytdl-core");

module.exports = async function ytCommand(sock, chatId, message) {
    try {

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            "";

        const args = text.split(" ");
        const url = args[1];

        if (!url) {
            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 YOUTUBE DOWNLOADER 〕━━━⬣
┃
┃ ❌ Please provide a
┃ valid YouTube link.
┃
┃ Example:
┃ .yt https://youtu.be/xxxx
┃
╰━━━━━━━━━━━━━━⬣`
            }, { quoted: message });
        }

        if (!ytdl.validateURL(url)) {
            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 INVALID URL 〕━━━⬣
┃
┃ ❌ Unsupported or invalid
┃ YouTube URL detected.
┃
╰━━━━━━━━━━━━━━⬣`
            }, { quoted: message });
        }

        const info = await ytdl.getInfo(url);

        const title = info.videoDetails.title;
        const author = info.videoDetails.author.name;
        const views = info.videoDetails.viewCount;
        const duration = info.videoDetails.lengthSeconds;

        const thumb =
            info.videoDetails.thumbnails[
                info.videoDetails.thumbnails.length - 1
            ].url;

        const caption =
`╭━━━〔 YOUTUBE DOWNLOADER 〕━━━⬣
┃
┃ 🎬 Title:
┃ ${title}
┃
┃ 👤 Channel:
┃ ${author}
┃
┃ 👁 Views:
┃ ${views}
┃
┃ ⏱ Duration:
┃ ${Math.floor(duration / 60)} Minutes
┃
┣━━━〔 DOWNLOAD OPTIONS 〕━━━⬣
┃
┃ 1️⃣ Reply with *1* for Audio
┃ 2️⃣ Reply with *2* for Video
┃
╰━━━━━━━━━━━━━━━━━━⬣`;

        const sentMsg = await sock.sendMessage(
            chatId,
            {
                image: { url: thumb },
                caption: caption,
            },
            { quoted: message }
        );

        const listener = async (update) => {
            try {

                const m = update.messages[0];

                if (!m.message) return;

                const reply =
                    m.message?.conversation ||
                    m.message?.extendedTextMessage?.text;

                const repliedId =
                    m.message?.extendedTextMessage?.contextInfo?.stanzaId;

                if (!reply || !repliedId) return;

                if (repliedId !== sentMsg.key.id) return;

                // AUDIO DOWNLOAD
                if (reply === "1") {

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "⏳",
                            key: m.key,
                        },
                    });

                    const audioFormats = ytdl.filterFormats(
                        info.formats,
                        "audioonly"
                    );

                    const audio =
                        audioFormats.find(
                            (f) => f.container === "mp4"
                        ) || audioFormats[0];

                    await sock.sendMessage(
                        chatId,
                        {
                            audio: { url: audio.url },
                            mimetype: "audio/mp4",
                            fileName: `${title}.mp3`,
                            ptt: false,
                        },
                        { quoted: m }
                    );

                    await sock.sendMessage(
                        chatId,
                        {
                            text:
`╭━━━〔 AUDIO DOWNLOADED 〕━━━⬣
┃
┃ 🎵 ${title}
┃
┃ ✅ Download Completed
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        },
                        { quoted: m }
                    );

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "✅",
                            key: m.key,
                        },
                    });

                    sock.ev.off("messages.upsert", listener);
                }

                // VIDEO DOWNLOAD
                else if (reply === "2") {

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "⏳",
                            key: m.key,
                        },
                    });

                    const video = ytdl.chooseFormat(
                        info.formats,
                        {
                            quality: "18",
                        }
                    );

                    await sock.sendMessage(
                        chatId,
                        {
                            video: { url: video.url },
                            mimetype: "video/mp4",
                            fileName: `${title}.mp4`,
                            caption:
`╭━━━〔 VIDEO DOWNLOADED 〕━━━⬣
┃
┃ 🎬 ${title}
┃
┃ ✅ Download Completed
┃
╰━━━━━━━━━━━━━━━━━━⬣`
                        },
                        { quoted: m }
                    );

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "✅",
                            key: m.key,
                        },
                    });

                    sock.ev.off("messages.upsert", listener);
                }

            } catch (err) {

                console.log(err);

                await sock.sendMessage(chatId, {
                    text:
`╭━━━〔 ERROR 〕━━━⬣
┃
┃ ❌ Download failed.
┃ Please try again later.
┃
╰━━━━━━━━━━━━━━⬣`
                }, { quoted: message });
            }
        };

        sock.ev.on("messages.upsert", listener);

    } catch (error) {

        console.log(error);

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 DOWNLOAD FAILED 〕━━━⬣
┃
┃ ❌ Unable to process
┃ the YouTube link.
┃
╰━━━━━━━━━━━━━━⬣`
        }, { quoted: message });
    }
};

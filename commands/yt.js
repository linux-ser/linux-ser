const ytdl = require("@distube/ytdl-core");
const https = require("https");

module.exports = async function ytCommand(sock, chatId, message) {

    try {

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            "";

        const args = text.split(" ");
        const url = args[1];

        // NO URL
        if (!url) {

            await sock.sendMessage(chatId, {
                react: {
                    text: "⚠️",
                    key: message.key,
                },
            });

            return await sock.sendMessage(
                chatId,
                {
                    text:
`╭━━━〔 ⚠️ Missing Link 〕━━━╮
┃ ✦ Please provide
┃ ✦ a YouTube link
┃
┃ 📌 Example:
┃ ✦ .yt https://youtu.be/xxxx
╰━━━━━━━━━━━━━━━━━━╯`
                },
                { quoted: message }
            );
        }

        // INVALID URL
        if (!ytdl.validateURL(url)) {

            await sock.sendMessage(chatId, {
                react: {
                    text: "❌",
                    key: message.key,
                },
            });

            return await sock.sendMessage(
                chatId,
                {
                    text:
`╭━━━〔 🚫 Invalid URL 〕━━━╮
┃ ✦ Unsupported YouTube link
┃ ✦ Please check the URL
╰━━━━━━━━━━━━━━━━━━╯`
                },
                { quoted: message }
            );
        }

        // LOADING REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: "🔍",
                key: message.key,
            },
        });

        // FIXED GET INFO
        let info;

        try {

            const agent = ytdl.createAgent();

            info = await ytdl.getInfo(url, {
                requestOptions: {
                    agent,
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
                    },
                },
            });

        } catch (err) {

            console.log("GET INFO ERROR:", err);

            // SECOND TRY
            try {

                info = await ytdl.getBasicInfo(url);

            } catch (err2) {

                console.log("BASIC INFO ERROR:", err2);

                await sock.sendMessage(chatId, {
                    react: {
                        text: "❌",
                        key: message.key,
                    },
                });

                return await sock.sendMessage(
                    chatId,
                    {
                        text:
`╭━━━〔 ⚠️ Video Unavailable 〕━━━╮
┃ ✦ Failed to fetch video
┃ ✦ Private or restricted video
┃ ✦ Invalid YouTube content
╰━━━━━━━━━━━━━━━━━━╯`
                    },
                    { quoted: message }
                );
            }
        }

        const title = info.videoDetails.title;
        const author = info.videoDetails.author.name;
        const views = info.videoDetails.viewCount;
        const duration = info.videoDetails.lengthSeconds;

        const thumb =
            info.videoDetails.thumbnails[
                info.videoDetails.thumbnails.length - 1
            ].url;

        // MAIN MENU
        const caption =
`╭━━━〔 🎥 YouTube Downloader 〕━━━╮
┃ ✦ 🎬 Title:
┃ ✦ ${title}
┃
┃ ✦ 👤 Channel:
┃ ✦ ${author}
┃
┃ ✦ 👁 Views:
┃ ✦ ${views}
┃
┃ ✦ ⏱ Duration:
┃ ✦ ${Math.floor(duration / 60)} Minutes
┃
┣━━━〔 📥 Download Options 〕━━━┫
┃ ✦ Reply *1* for Audio
┃ ✦ Reply *2* for Video
╰━━━━━━━━━━━━━━━━━━╯`;

        const sentMsg = await sock.sendMessage(
            chatId,
            {
                image: { url: thumb },
                caption: caption,
            },
            { quoted: message }
        );

        // LISTENER
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

                // AUDIO
                if (reply === "1") {

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "⬇️",
                            key: m.key,
                        },
                    });

                    const audioFormats =
                        ytdl.filterFormats(
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
`╭━━━〔 🎵 Audio Downloaded 〕━━━╮
┃ ✦ 🎧 ${title}
┃
┃ ✦ ✅ Download Completed
┃ ✦ 📥 Audio Sent Successfully
╰━━━━━━━━━━━━━━━━━━╯`
                        },
                        { quoted: m }
                    );

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "🎉",
                            key: m.key,
                        },
                    });

                    sock.ev.off("messages.upsert", listener);
                }

                // VIDEO
                else if (reply === "2") {

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "⬇️",
                            key: m.key,
                        },
                    });

                    const video =
                        ytdl.chooseFormat(
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
`╭━━━〔 🎬 Video Downloaded 〕━━━╮
┃ ✦ 📹 ${title}
┃
┃ ✦ ✅ Download Completed
┃ ✦ 📥 Video Sent Successfully
╰━━━━━━━━━━━━━━━━━━╯`
                        },
                        { quoted: m }
                    );

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "🎉",
                            key: m.key,
                        },
                    });

                    sock.ev.off("messages.upsert", listener);
                }

            } catch (err) {

                console.log("DOWNLOAD ERROR:", err);

                await sock.sendMessage(chatId, {
                    react: {
                        text: "❌",
                        key: message.key,
                    },
                });

                await sock.sendMessage(
                    chatId,
                    {
                        text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Unable to download media
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`
                    },
                    { quoted: message }
                );
            }
        };

        sock.ev.on("messages.upsert", listener);

    } catch (error) {

        console.log("YT MAIN ERROR:", error);

        await sock.sendMessage(chatId, {
            react: {
                text: "❌",
                key: message.key,
            },
        });

        await sock.sendMessage(
            chatId,
            {
                text:
`╭━━━〔 ⚠️ System Error 〕━━━╮
┃ ✦ Failed to process request
┃ ✦ Internal server problem
╰━━━━━━━━━━━━━━━━━━╯`
            },
            { quoted: message }
        );
    }
};

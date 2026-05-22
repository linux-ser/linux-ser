const axios = require("axios");

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

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ⚠️ Missing Link 〕━━━╮
┃ ✦ Please provide
┃ ✦ a YouTube link
┃
┃ 📌 Example:
┃ ✦ .yt https://youtu.be/xxxx
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        // INVALID URL
        if (
            !url.includes("youtube.com") &&
            !url.includes("youtu.be")
        ) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🚫 Invalid URL 〕━━━╮
┃ ✦ Unsupported YouTube link
┃ ✦ Please check the URL
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        // REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: "🔍",
                key: message.key,
            },
        });

        // API REQUEST
        const api =
`https://api.giftedtech.web.id/api/download/ytdl?apikey=gifted&url=${encodeURIComponent(url)}`;

        const response = await axios.get(api);

        const data = response.data;

        if (!data.success) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Failed to fetch video
┃ ✦ Try another YouTube link
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        const title = data.result.title;
        const thumbnail = data.result.thumbnail;
        const audio = data.result.audio;
        const video = data.result.video;

        // MENU
        const sentMsg = await sock.sendMessage(
            chatId,
            {
                image: { url: thumbnail },
                caption:
`╭━━━〔 🎥 YouTube Downloader 〕━━━╮
┃ ✦ 🎬 ${title}
┃
┣━━━〔 📥 Download Options 〕━━━┫
┃ ✦ Reply *1* for Audio
┃ ✦ Reply *2* for Video
╰━━━━━━━━━━━━━━━━━━╯`
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

                    await sock.sendMessage(
                        chatId,
                        {
                            audio: {
                                url: audio
                            },
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

                    await sock.sendMessage(
                        chatId,
                        {
                            video: {
                                url: video
                            },
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
                    text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Unable to download media
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`
                }, { quoted: message });
            }
        };

        sock.ev.on("messages.upsert", listener);

    } catch (error) {

        console.log("YT ERROR:", error);

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ⚠️ System Error 〕━━━╮
┃ ✦ Failed to process request
┃ ✦ Internal server problem
╰━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });
    }
};

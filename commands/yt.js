const { Innertube } = require("youtubei.js");

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

        // LOADING REACTION
        await sock.sendMessage(chatId, {
            react: {
                text: "🔍",
                key: message.key,
            },
        });

        const youtube = await Innertube.create();

        const video = await youtube.getInfo(url);

        if (!video) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 🚫 Video Not Found 〕━━━╮
┃ ✦ Invalid or unavailable video
╰━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        const title = video.basic_info.title;
        const author = video.basic_info.author;
        const duration = Math.floor(video.basic_info.duration / 60);
        const views = video.basic_info.view_count;

        const thumb =
            video.basic_info.thumbnail[0].url;

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
┃ ✦ ${duration} Minutes
┃
┣━━━〔 📥 Download Options 〕━━━┫
┃ ✦ Reply *1* for Audio
┃ ✦ Reply *2* for Video
╰━━━━━━━━━━━━━━━━━━╯`;

        const sentMsg = await sock.sendMessage(
            chatId,
            {
                image: { url: thumb },
                caption,
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

                // AUDIO
                if (reply === "1") {

                    await sock.sendMessage(chatId, {
                        react: {
                            text: "⬇️",
                            key: m.key,
                        },
                    });

                    const audio = video.streaming_data.adaptive_formats.find(
                        f => f.has_audio && !f.has_video
                    );

                    await sock.sendMessage(
                        chatId,
                        {
                            audio: {
                                url: audio.url
                            },
                            mimetype: "audio/mp4",
                            fileName: `${title}.mp3`,
                            ptt: false,
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

                    const vid = video.streaming_data.formats.find(
                        f => f.has_video && f.has_audio
                    );

                    await sock.sendMessage(
                        chatId,
                        {
                            video: {
                                url: vid.url
                            },
                            mimetype: "video/mp4",
                            fileName: `${title}.mp4`,
                            caption:
`╭━━━〔 🎬 Video Downloaded 〕━━━╮
┃ ✦ 📹 ${title}
┃
┃ ✦ ✅ Download Completed
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

                console.log(err);

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

        console.log(error);

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ⚠️ System Error 〕━━━╮
┃ ✦ Failed to process request
┃ ✦ Internal server problem
╰━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });
    }
};

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

        // LOADING
        await sock.sendMessage(chatId, {
            react: {
                text: "🔍",
                key: message.key,
            },
        });

        // API
        const api =
`https://api.vevioz.com/api/button/mp4?url=${encodeURIComponent(url)}`;

        // VIDEO ID
        const idMatch =
            url.match(
                /(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/i
            );

        const videoId = idMatch ? idMatch[1] : null;

        const thumb =
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        // MENU
        const sentMsg = await sock.sendMessage(
            chatId,
            {
                image: { url: thumb },
                caption:
`╭━━━〔 🎥 YouTube Downloader 〕━━━╮
┃ ✦ Choose download type
┃
┣━━━〔 📥 Download Options 〕━━━┫
┃ ✦ Reply *1* for Audio
┃ ✦ Reply *2* for Video
╰━━━━━━━━━━━━━━━━━━╯`
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

                    const audioUrl =
`https://api.vevioz.com/api/button/mp3?url=${encodeURIComponent(url)}`;

                    await sock.sendMessage(
                        chatId,
                        {
                            audio: {
                                url: audioUrl
                            },
                            mimetype: "audio/mp4",
                            fileName: "youtube-audio.mp3",
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

                    await sock.sendMessage(
                        chatId,
                        {
                            video: {
                                url: api
                            },
                            mimetype: "video/mp4",
                            fileName: "youtube-video.mp4",
                            caption:
`╭━━━〔 🎬 Video Downloaded 〕━━━╮
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

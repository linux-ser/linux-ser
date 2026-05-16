const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function facebookCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const url = text.split(' ').slice(1).join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: "Please provide a Facebook video URL.\nExample: .fb https://www.facebook.com/..."
            }, { quoted: message });
        }

        // Validate Facebook URL
        if (!url.includes('facebook.com')) {
            return await sock.sendMessage(chatId, {
                text: "That is not a Facebook link."
            }, { quoted: message });
        }

        // 📥 Downloading reaction
        await sock.sendMessage(chatId, {
            react: { text: '📥', key: message.key }
        });

        // Resolve share/short URLs
        let resolvedUrl = url;

        try {
            const res = await axios.get(url, {
                timeout: 20000,
                maxRedirects: 10,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const possible = res?.request?.res?.responseUrl;

            if (possible && typeof possible === 'string') {
                resolvedUrl = possible;
            }

        } catch {
            // ignore
        }

        // API Fetch Function
        async function fetchFromApi(u) {
            const apiUrl = `https://api.hanggts.xyz/download/facebook?url=${encodeURIComponent(u)}`;

            try {
                const response = await axios.get(apiUrl, {
                    timeout: 20000,
                    headers: {
                        'accept': '*/*',
                        'User-Agent': 'Mozilla/5.0'
                    },
                    maxRedirects: 5,
                    validateStatus: s => s >= 200 && s < 500
                });

                if (response.data) {
                    if (
                        response.data.status === true ||
                        response.data.result ||
                        response.data.data ||
                        response.data.url ||
                        response.data.download ||
                        response.data.video
                    ) {
                        return {
                            response,
                            apiName: 'Hanggts API'
                        };
                    }
                }

            } catch (error) {
                console.error(`Hanggts API failed: ${error.message}`);
            }

            throw new Error('Hanggts API failed');
        }

        let apiResult;

        try {
            apiResult = await fetchFromApi(resolvedUrl);
        } catch {
            apiResult = await fetchFromApi(url);
        }

        const response = apiResult.response;
        const data = response.data;

        let fbvid = null;
        let title = null;

        // Parse API Response
        if (data) {

            if (data.result) {

                if (data.result.media) {
                    fbvid = data.result.media.video_hd || data.result.media.video_sd;
                    title = data.result.info?.title || "Facebook Video";
                }

                else if (typeof data.result === 'object' && data.result.url) {
                    fbvid = data.result.url;
                    title = data.result.title || "Facebook Video";
                }

                else if (typeof data.result === 'string' && data.result.startsWith('http')) {
                    fbvid = data.result;
                    title = "Facebook Video";
                }

                else if (data.result.download) {
                    fbvid = data.result.download;
                    title = data.result.title || "Facebook Video";
                }

                else if (data.result.video) {
                    fbvid = data.result.video;
                    title = data.result.title || "Facebook Video";
                }
            }

            if (!fbvid && data.data) {

                if (typeof data.data === 'object' && data.data.url) {
                    fbvid = data.data.url;
                    title = data.data.title || "Facebook Video";
                }

                else if (typeof data.data === 'string' && data.data.startsWith('http')) {
                    fbvid = data.data;
                    title = "Facebook Video";
                }

                else if (Array.isArray(data.data) && data.data.length > 0) {

                    const hdVideo = data.data.find(item =>
                        (item.quality === 'HD' || item.quality === 'high')
                    );

                    const sdVideo = data.data.find(item =>
                        (item.quality === 'SD' || item.quality === 'low')
                    );

                    fbvid = hdVideo?.url || sdVideo?.url || data.data[0]?.url;

                    title =
                        hdVideo?.title ||
                        sdVideo?.title ||
                        "Facebook Video";
                }

                else if (data.data.download) {
                    fbvid = data.data.download;
                    title = data.data.title || "Facebook Video";
                }

                else if (data.data.video) {
                    fbvid = data.data.video;
                    title = data.data.title || "Facebook Video";
                }
            }

            if (!fbvid && data.url) {
                fbvid = data.url;
                title = data.title || "Facebook Video";
            }

            if (!fbvid && data.download) {
                fbvid = data.download;
                title = data.title || "Facebook Video";
            }

            if (!fbvid && data.video) {

                if (typeof data.video === 'string') {
                    fbvid = data.video;
                }

                else if (data.video.url) {
                    fbvid = data.video.url;
                }

                title = data.title || "Facebook Video";
            }
        }

        if (!fbvid) {

            // ❌ Failed reaction
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: message.key }
            });

            return await sock.sendMessage(chatId, {
                text:
                    '❌ Failed to get video URL from Facebook.\n\n' +
                    'Possible reasons:\n' +
                    '• Video is private or deleted\n' +
                    '• Link is invalid\n' +
                    '• Video unavailable'
            }, { quoted: message });
        }

        // 📤 Uploading reaction
        await sock.sendMessage(chatId, {
            react: { text: '📤', key: message.key }
        });

        try {

            const caption = title
                ? `*ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*\n\n📝 Title: ${title}`
                : "*ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*";

            // Direct URL send
            await sock.sendMessage(chatId, {
                video: { url: fbvid },
                mimetype: "video/mp4",
                caption: caption
            }, { quoted: message });

            // ✅ Success reaction
            await sock.sendMessage(chatId, {
                react: { text: '✅', key: message.key }
            });

            return;

        } catch (urlError) {

            console.error(`URL method failed: ${urlError.message}`);

            try {

                const tmpDir = path.join(process.cwd(), 'tmp');

                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

                const videoResponse = await axios({
                    method: 'GET',
                    url: fbvid,
                    responseType: 'stream',
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Referer': 'https://www.facebook.com/'
                    }
                });

                const writer = fs.createWriteStream(tempFile);

                videoResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const caption = title
                    ? `*ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*\n\n📝 Title: ${title}`
                    : "*ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*";

                await sock.sendMessage(chatId, {
                    video: { url: tempFile },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: message });

                // Delete temp file
                try {
                    fs.unlinkSync(tempFile);
                } catch (err) {}

                // ✅ Success reaction
                await sock.sendMessage(chatId, {
                    react: { text: '✅', key: message.key }
                });

                return;

            } catch (bufferError) {

                console.error(`Buffer method failed: ${bufferError.message}`);

                // ❌ Failed reaction
                await sock.sendMessage(chatId, {
                    react: { text: '❌', key: message.key }
                });

                throw new Error('Both URL and buffer methods failed');
            }
        }

    } catch (error) {

        console.error('Error in Facebook command:', error);

        // ❌ Failed reaction
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        await sock.sendMessage(chatId, {
            text: "An error occurred.\n\nError: " + error.message
        }, { quoted: message });
    }
}

module.exports = facebookCommand;

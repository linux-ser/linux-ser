const { igdl } = require("ruhend-scraper");

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Function to extract unique media URLs
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();

    for (const media of mediaData) {
        if (!media.url) continue;

        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }

    return uniqueMedia;
}

// Function to validate media URL
function isValidMediaUrl(url) {
    if (!url || typeof url !== 'string') return false;

    return url.includes('cdninstagram.com') ||
           url.includes('instagram') ||
           url.includes('http');
}

async function instagramCommand(sock, chatId, message) {
    try {

        // Prevent duplicate processing
        if (processedMessages.has(message.key.id)) {
            return;
        }

        processedMessages.add(message.key.id);

        // Remove after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text;

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: "Please provide an Instagram link for the video."
            });
        }

        // Instagram URL validation
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//,
            /https?:\/\/(?:www\.)?instagram\.com\/p\//,
            /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
            /https?:\/\/(?:www\.)?instagram\.com\/tv\//
        ];

        const isValidUrl = instagramPatterns.some(pattern => pattern.test(text));

        if (!isValidUrl) {
            return await sock.sendMessage(chatId, {
                text: "That is not a valid Instagram link. Please provide a valid Instagram post, reel, or video link."
            });
        }

        // 📥 Downloading reaction
        await sock.sendMessage(chatId, {
            react: { text: '📥', key: message.key }
        });

        const downloadData = await igdl(text);

        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {

            // ❌ Failed reaction
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: message.key }
            });

            return await sock.sendMessage(chatId, {
                text: "❌ No media found at the provided link. The post might be private or the link is invalid."
            });
        }

        const mediaData = downloadData.data;

        // Remove duplicate URLs
        const uniqueMedia = extractUniqueMedia(mediaData);

        // Limit max media
        const mediaToDownload = uniqueMedia.slice(0, 20);

        if (mediaToDownload.length === 0) {

            // ❌ Failed reaction
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: message.key }
            });

            return await sock.sendMessage(chatId, {
                text: "❌ No valid media found to download."
            });
        }

        // 📤 Uploading reaction
        await sock.sendMessage(chatId, {
            react: { text: '📤', key: message.key }
        });

        let successCount = 0;

        for (let i = 0; i < mediaToDownload.length; i++) {

            try {

                const media = mediaToDownload[i];
                const mediaUrl = media.url;

                if (!isValidMediaUrl(mediaUrl)) {
                    continue;
                }

                // Detect video
                const isVideo =
                    /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
                    media.type === 'video' ||
                    text.includes('/reel/') ||
                    text.includes('/tv/');

                if (isVideo) {

                    await sock.sendMessage(chatId, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption: "*ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*"
                    }, { quoted: message });

                } else {

                    await sock.sendMessage(chatId, {
                        image: { url: mediaUrl },
                        caption: "*ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*"
                    }, { quoted: message });
                }

                successCount++;

                // Delay between uploads
                if (i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (mediaError) {

                console.error(`Error downloading media ${i + 1}:`, mediaError);

                // Continue next media
                continue;
            }
        }

        // Final reaction
        if (successCount > 0) {

            // ✅ Success reaction
            await sock.sendMessage(chatId, {
                react: { text: '✅', key: message.key }
            });

        } else {

            // ❌ Failed reaction
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: message.key }
            });

            await sock.sendMessage(chatId, {
                text: "❌ Failed to download media from Instagram."
            });
        }

    } catch (error) {

        console.error('Error in Instagram command:', error);

        // ❌ Failed reaction
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        await sock.sendMessage(chatId, {
            text: "❌ An error occurred while processing the Instagram request. Please try again."
        });
    }
}

module.exports = instagramCommand;

const axios = require('axios');

async function soraCommand(sock, chatId, message) {
    try {
        const rawText =
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const used = rawText.split(/\s+/)[0] || '.sora';
        const args = rawText.slice(used.length).trim();

        const quoted =
            message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        const quotedText =
            quoted?.conversation ||
            quoted?.extendedTextMessage?.text ||
            quoted?.imageMessage?.caption ||
            quoted?.videoMessage?.caption ||
            '';

        const input = args || quotedText;

        // No prompt
        if (!input) {
            await sock.sendMessage(
                chatId,
                {
                    text: '⚠️ Usage: .sora <prompt>\n\nExample:\n.sora anime girl with blue hair'
                },
                { quoted: message }
            );

            await sock.sendMessage(chatId, {
                react: {
                    text: '❌',
                    key: message.key
                }
            });

            return;
        }

        // React loading
        await sock.sendMessage(chatId, {
            react: {
                text: '🎬',
                key: message.key
            }
        });

        // API request
        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(input)}`;

        const response = await axios.get(apiUrl, {
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const data = response.data;

        // Debug
        console.log('[SORA API RESPONSE]', data);

        // Flexible response detection
        const videoUrl =
            data?.videoUrl ||
            data?.result?.videoUrl ||
            data?.result ||
            data?.data?.videoUrl ||
            data?.data?.result ||
            data?.url;

        // Invalid API response
        if (!videoUrl || typeof videoUrl !== 'string') {
            throw new Error('Invalid API response');
        }

        // Send generated video
        await sock.sendMessage(
            chatId,
            {
                video: { url: videoUrl },
                mimetype: 'video/mp4',
                caption: `🎥 *SORA VIDEO GENERATED*\n\n📝 Prompt: ${input}`
            },
            { quoted: message }
        );

        // Success react
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (error) {
        console.error('[SORA ERROR]', error?.response?.data || error.message || error);

        // Error react
        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        let errMsg = '❌ Failed to generate video.\n\n⚠️ Try another prompt later.';

        // API timeout
        if (
            error.code === 'ECONNABORTED' ||
            error.message?.includes('timeout')
        ) {
            errMsg = '⏳ Video generation timed out.\n\nTry a shorter prompt.';
        }

        // Bad response
        if (error.response?.status === 404) {
            errMsg = '❌ API endpoint not found.';
        }

        if (error.response?.status === 500) {
            errMsg = '❌ SORA server error.\n\nTry again later.';
        }

        await sock.sendMessage(
            chatId,
            {
                text: errMsg
            },
            { quoted: message }
        );
    }
}

module.exports = soraCommand;

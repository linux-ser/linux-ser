const axios = require('axios');
const settings = require('../settings');

async function gifCommand(sock, chatId, message) {
    try {
        const apiKey = settings.giphyApiKey;

        // Get message text safely
        const rawText =
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Extract query
        const used = rawText.split(/\s+/)[0] || '.gif';
        const query = rawText.slice(used.length).trim();

        // No query
        if (!query) {
            await sock.sendMessage(
                chatId,
                {
                    text: '⚠️ Usage: .gif <search>\n\nExample:\n.gif anime'
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

        // Missing API key
        if (!apiKey) {
            throw new Error('Missing Giphy API key');
        }

        // Loading react
        await sock.sendMessage(chatId, {
            react: {
                text: '🔍',
                key: message.key
            }
        });

        // Fetch GIF
        const response = await axios.get(
            'https://api.giphy.com/v1/gifs/search',
            {
                params: {
                    api_key: apiKey,
                    q: query,
                    limit: 1,
                    rating: 'g'
                },
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        );

        const gifData = response.data?.data?.[0];

        if (!gifData) {
            await sock.sendMessage(
                chatId,
                {
                    text: `❌ No GIF found for "${query}"`
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

        const gifUrl =
            gifData.images?.original?.mp4 ||
            gifData.images?.downsized_medium?.url;

        // Send GIF
        await sock.sendMessage(
            chatId,
            {
                video: { url: gifUrl },
                gifPlayback: true,
                caption: `🎬 GIF Result for: *${query}*`
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
        console.error('[GIF ERROR]', error?.response?.data || error.message || error);

        // Error react
        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

        let errMsg = '❌ Failed to fetch GIF.\n\n⚠️ Try again later.';

        if (error.message?.includes('API key')) {
            errMsg = '❌ Giphy API key missing in settings.js';
        }

        if (error.response?.status === 403) {
            errMsg = '❌ Invalid Giphy API key.';
        }

        if (error.response?.status === 429) {
            errMsg = '⏳ Giphy API rate limit reached.\nTry again later.';
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

module.exports = gifCommand;

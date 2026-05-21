const axios = require('axios');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const config = require('./config');

// OpenAI Client
const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: "Please provide a question after .gpt or .gemini\n\nExample: .gpt write a basic html code"
            }, {
                quoted: message
            });
        }

        // Get command and query
        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: "Please provide a question after .gpt or .gemini"
            }, {
                quoted: message
            });
        }

        try {
            // React while processing
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            });

            // =========================
            // CHATGPT COMMAND
            // =========================
            if (command === '.gpt') {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4.1-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI assistant.'
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                });

                const answer = completion.choices[0]?.message?.content;

                if (!answer) {
                    throw new Error('No response from ChatGPT');
                }

                await sock.sendMessage(chatId, {
                    text: answer
                }, {
                    quoted: message
                });
            }

            // =========================
            // GEMINI COMMAND
            // =========================
            else if (command === '.gemini') {
                const apis = [
                    `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                    `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`
                ];

                for (const api of apis) {
                    try {
                        const response = await fetch(api);
                        const data = await response.json();

                        if (data.message || data.data || data.answer || data.result) {
                            const answer = data.message || data.data || data.answer || data.result;

                            await sock.sendMessage(chatId, {
                                text: answer
                            }, {
                                quoted: message
                            });

                            return;
                        }
                    } catch (e) {
                        continue;
                    }
                }

                throw new Error('All Gemini APIs failed');
            }

        } catch (error) {
            console.error('API Error:', error);

            await sock.sendMessage(chatId, {
                text: `❌ Failed to get response.\n\n${error.message}`,
                contextInfo: {
                    mentionedJid: [message.key.participant || message.key.remoteJid],
                    quotedMessage: message.message
                }
            }, {
                quoted: message
            });
        }

    } catch (error) {
        console.error('AI Command Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ An error occurred. Please try again later.',
            contextInfo: {
                mentionedJid: [message.key.participant || message.key.remoteJid],
                quotedMessage: message.message
            }
        }, {
            quoted: message
        });
    }
}

module.exports = aiCommand;

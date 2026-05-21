const axios = require('axios');

async function aiCommand(sock, chatId, message) {

    try {

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const args = text.trim().split(' ');

        const command =
            args[0]?.toLowerCase();

        const query =
            args.slice(1).join(' ').trim();

        // No query
        if (!query) {

            return await sock.sendMessage(chatId, {

                text:
`🤖 GPT Assistant

Send:
.gpt your question

Example:
.gpt write a javascript calculator`

            }, { quoted: message });

        }

        // React
        await sock.sendMessage(chatId, {

            react: {
                text: '🤖',
                key: message.key
            }

        });

        // API LIST
        const apis = [

            `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,

            `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,

            `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,

            `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`,

            `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`

        ];

        let answer = null;

        // Try APIs
        for (const api of apis) {

            try {

                const response = await axios.get(api, {

                    timeout: 20000,

                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }

                });

                const data = response.data;

                // Find valid string
                answer = [

                    data.result,
                    data.answer,
                    data.message,
                    data.data,
                    data.response,
                    data.text

                ].find(v =>

                    typeof v === 'string' &&
                    v.trim() !== '' &&
                    v.trim().toLowerCase() !== 'null' &&
                    v.trim().toLowerCase() !== 'undefined'

                );

                // Object response support
                if (
                    !answer &&
                    typeof data === 'object'
                ) {

                    const values =
                    Object.values(data);

                    answer = values.find(v =>

                        typeof v === 'string' &&
                        v.trim() !== '' &&
                        v.trim().toLowerCase() !== 'null'

                    );

                }

                // Success
                if (
                    typeof answer === 'string' &&
                    answer.trim().length > 2
                ) {

                    break;

                }

            } catch (e) {

                console.log(
                    'API Failed:',
                    api
                );

                continue;

            }

        }

        // No response
        if (!answer) {

            answer =
            '❌ AI server busy. Please try again later.';

        }

        // Send answer
        await sock.sendMessage(chatId, {

            text: answer

        }, { quoted: message });

        // Success react
        await sock.sendMessage(chatId, {

            react: {
                text: '✅',
                key: message.key
            }

        });

    } catch (error) {

        console.log(
            'AI COMMAND ERROR:',
            error
        );

        await sock.sendMessage(chatId, {

            text:
            '❌ Failed to get response. Please try again later.'

        }, { quoted: message });

    }

}

module.exports = aiCommand;

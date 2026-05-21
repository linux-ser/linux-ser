const axios = require('axios');

async function aiCommand(sock, chatId, message) {

    try {

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const args =
            text.trim().split(' ');

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

        // AI APIs
        const apis = [

            `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,

            `https://api.gurusensei.workers.dev/llm?prompt=${encodeURIComponent(query)}`,

            `https://luminai.my.id/`

        ];

        let answer = null;

        // Try APIs
        for (const api of apis) {

            try {

                let data;

                // Luminai POST API
                if (api.includes('luminai')) {

                    const response =
                    await axios.post(api, {

                        content: query,
                        user: 'LinuxSer'

                    }, {

                        timeout: 30000,

                        headers: {
                            'Content-Type':
                            'application/json'
                        }

                    });

                    data = response.data;

                }

                // Normal GET APIs
                else {

                    const response =
                    await axios.get(api, {

                        timeout: 30000,

                        headers: {
                            'User-Agent':
                            'Mozilla/5.0',

                            'Accept':
                            'application/json'
                        }

                    });

                    data = response.data;

                }

                // Skip HTML response
                if (

                    typeof data === 'string' &&

                    (
                        data.includes('<!DOCTYPE html>') ||
                        data.includes('<html')
                    )

                ) {

                    console.log(
                        'HTML response skipped'
                    );

                    continue;

                }

                // Extract possible text
                const possible = [

                    data.result,
                    data.answer,
                    data.message,
                    data.response,
                    data.text,
                    data.content,
                    data.data

                ];

                answer = possible.find(v =>

                    typeof v === 'string' &&

                    v.trim() !== '' &&

                    v.trim().toLowerCase()
                    !== 'null' &&

                    v.trim().toLowerCase()
                    !== 'undefined'

                );

                // Deep object scan
                if (
                    !answer &&
                    typeof data === 'object'
                ) {

                    const values =
                    JSON.stringify(data);

                    if (
                        values &&
                        values.length > 5
                    ) {

                        answer = values
                        .replace(/[{}[\]"]/g, '');

                    }

                }

                // Success
                if (
                    answer &&
                    answer.length > 2
                ) {

                    break;

                }

            } catch (e) {

                console.log(
                    'API ERROR:',
                    e.message
                );

                continue;

            }

        }

        // No response
        if (!answer) {

            answer =
            '❌ AI server busy. Please try again later.';

        }

        // Limit very long messages
        if (answer.length > 4000) {

            answer =
            answer.slice(0, 4000);

        }

        // Send response
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

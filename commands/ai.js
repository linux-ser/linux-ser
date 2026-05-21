const fetch = require('node-fetch');
const OpenAI = require('openai');
require('./config');

const openai = new OpenAI({
    apiKey: global.OPENAI_API_KEY
});

async function aiCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text;

        if (!text) {
            return await sock.sendMessage(
                chatId,
                {
                    text:
`🤖 GPT Assistant

Send:
.gpt your question

Example:
.gpt write a javascript calculator`
                },
                {
                    quoted: message
                }
            );
        }

        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(
                chatId,
                {
                    text:
`🤖 GPT Assistant

Send:
.gpt your question

Example:
.gpt write a javascript calculator`
                },
                {
                    quoted: message
                }
            );
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '🤖',
                key: message.key
            }
        });

        // GPT COMMAND
        if (command === '.gpt') {

            const completion =
                await openai.chat.completions.create({
                    model: 'gpt-4.1-mini',
                    messages: [
                        {
                            role: 'system',
                            content:
                                'You are a helpful AI assistant.'
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                });

            const answer =
                completion.choices[0]?.message?.content;

            if (!answer) {
                throw new Error('No response from OpenAI');
            }

            await sock.sendMessage(
                chatId,
                {
                    text: answer
                },
                {
                    quoted: message
                }
            );
        }

    } catch (error) {
        console.error(error);

        await sock.sendMessage(
            chatId,
            {
                text:
`❌ GPT Error

${error.message}`
            },
            {
                quoted: message
            }
        );
    }
}

module.exports = aiCommand;

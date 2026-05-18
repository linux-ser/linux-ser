const axios = require('axios');

async function imgCommand(sock, chatId, message, args) {
    try {

        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(chatId, {
                text:
`╭───〔 📸 IMAGE SEARCH 〕───╮
│ ❌ Please enter search text
│ 📌 Example : .img anime
╰────────────────────╯`
            }, {
                quoted: message
            });
        }

        // Loading Reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '🔍',
                key: message.key
            }
        });

        const apiKey = global.BING_API_KEY;

        if (!apiKey) {
            return await sock.sendMessage(chatId, {
                text: '❌ Bing API Key Missing'
            }, {
                quoted: message
            });
        }

        // Bing Image Search API
        const response = await axios.get(
            'https://api.bing.microsoft.com/v7.0/images/search',
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey
                },
                params: {
                    q: query,
                    count: 10,
                    safeSearch: 'Moderate'
                }
            }
        );

        const results = response.data.value;

        if (!results || results.length === 0) {
            return await sock.sendMessage(chatId, {
                text:
`╭───〔 ❌ NO RESULT 〕───╮
│ 🚫 No images found
│ 🔍 Try another query
╰────────────────────╯`
            }, {
                quoted: message
            });
        }

        // Random Best Result
        const randomImage =
            results[Math.floor(Math.random() * results.length)];

        const imageUrl = randomImage.contentUrl;

        // Send Image
        await sock.sendMessage(chatId, {

            image: {
                url: imageUrl
            },

            caption:
`╭───〔 📸 IMAGE SEARCH 〕───╮
│ 🔍 Query : ${query}
│ 🌐 Source : Bing Search API
│ ✅ Image Found Successfully
╰────────────────────╯`

        }, {
            quoted: message
        });

        // Success Reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (err) {

        console.log('BING IMG ERROR:', err.response?.data || err.message);

        await sock.sendMessage(chatId, {
            text:
`╭───〔 ❌ ERROR 〕───╮
│ ⚠️ Failed to fetch image
│ 🌐 Check API Key or Internet
╰────────────────────╯`
        }, {
            quoted: message
        });

        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });
    }
}

module.exports = imgCommand;

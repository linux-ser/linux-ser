const axios = require('axios');

async function imgCommand(sock, chatId, message, args) {

    try {

        const query = args.join(' ');

        if (!query) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 IMAGE SEARCH 〕━━━⬣
┃ ❌ Please enter search text
┃ 📌 Example:
┃ .img anime
╰━━━━━━━━━━━━━━⬣`
            }, {
                quoted: message
            });

        }

        // React
        await sock.sendMessage(chatId, {
            react: {
                text: '🔍',
                key: message.key
            }
        });

        // Unsplash API key
        const apiKey =
            global.APIKeys['https://api.unsplash.com'];

        // API URL
        const url =
`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${apiKey}`;

        // Fetch image
        const response = await axios.get(url);

        // No image
        if (!response.data?.urls?.regular) {

            return await sock.sendMessage(chatId, {
                text: '❌ No image found.'
            }, {
                quoted: message
            });

        }

        const imageUrl = response.data.urls.regular;

        // Send image
        await sock.sendMessage(chatId, {

            image: {
                url: imageUrl
            },

            caption:
`╭━━━〔 IMAGE RESULT 〕━━━⬣
┃ 🔎 Query : ${query}
┃ 🌐 Source : Unsplash
┃ 👑 𝐋ɪɴᴜх 𝐒ᴇʀ
╰━━━━━━━━━━━━━━⬣`

        }, {
            quoted: message
        });

        // Success react
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (err) {

        console.error('IMG ERROR:', err);

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ERROR 〕━━━⬣
┃ ❌ Failed to fetch image
╰━━━━━━━━━━━━━━⬣`
        }, {
            quoted: message
        });

    }

}

module.exports = imgCommand;

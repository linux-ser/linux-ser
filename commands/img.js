const axios = require('axios');

async function imgCommand(sock, chatId, message, args) {

    try {

        const query = args.join(' ');

        if (!query) {

            return await sock.sendMessage(chatId, {
                text:
`╭━━━〔 IMAGE SEARCH 〕━━━⬣
┃ ❌ Enter search text
┃ 📌 Example:
┃ .img anime
╰━━━━━━━━━━━━━━⬣`
            }, {
                quoted: message
            });

        }

        // Loading react
        await sock.sendMessage(chatId, {
            react: {
                text: '🔍',
                key: message.key
            }
        });

        // API Key
        const apiKey =
            global.APIKeys['https://api.pexels.com'];

        // Fetch images
        const response = await axios.get(

            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20`,

            {
                headers: {
                    Authorization: apiKey
                }
            }

        );

        // No result
        if (!response.data.photos.length) {

            return await sock.sendMessage(chatId, {
                text: '❌ No images found.'
            }, {
                quoted: message
            });

        }

        // Random image
        const random =
            response.data.photos[
                Math.floor(
                    Math.random() *
                    response.data.photos.length
                )
            ];

        const imageUrl = random.src.large;

        // Send image
        await sock.sendMessage(chatId, {

            image: {
                url: imageUrl
            },

            caption:
`╭━━━〔 IMAGE RESULT 〕━━━⬣
┃ 🔎 Query : ${query}
┃ 🌐 Source : Pexels
┃ 👑 Linux Ser
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

        console.log(err);

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

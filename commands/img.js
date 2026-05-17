const axios = require('axios');

async function imgCommand(sock, chatId, message, args) {

    try {

        const query = args.join(' ');

        // No query
        if (!query) {

            return await sock.sendMessage(chatId, {
                text:
`╭───〔 📸 ɪᴍᴀɢᴇ ꜱᴇᴀʀᴄʜ 〕───╮
│ ❌ ᴘʟᴇᴀꜱᴇ ᴇɴᴛᴇʀ ꜱᴇᴀʀᴄʜ ᴛᴇxᴛ
│ 📌 ᴇхᴀᴍᴘʟᴇ : .ɪᴍɢ ᴀɴɪᴍᴇ
╰────────────────────╯

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`
            }, {
                quoted: message
            });

        }

        // Loading reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '🔍',
                key: message.key
            }
        });

        // API Key
        const apiKey =
            global.APIKeys['https://api.pexels.com'];

        // Fetch images from Pexels
        const response = await axios.get(

            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20`,

            {
                headers: {
                    Authorization: apiKey
                }
            }

        );

        // No images found
        if (!response.data.photos.length) {

            return await sock.sendMessage(chatId, {
                text:
`╭───〔 ❌ ɴᴏ ʀᴇꜱᴜʟᴛ 〕───╮
│ 🚫 ɴᴏ ɪᴍᴀɢᴇꜱ ᴡᴇʀᴇ ꜰᴏᴜɴᴅ
│ 🔍 ᴛʀʏ ᴀɴᴏᴛʜᴇʀ 𝐐ᴜᴇʀʏ
╰────────────────────╯

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`
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
`╭───〔 📸 ɪᴍᴀɢᴇ ꜱᴇᴀʀᴄʜ 〕───╮
│ 🔍 Qᴜᴇʀʏ : ${query}
│ 🌐 Sᴏᴜʀᴄᴇ : Pᴇxᴇʟs Aᴘɪ
│ ✅ ɪᴍᴀɢᴇ ꜰᴏᴜɴᴅ ꜱᴜᴄᴄꜱꜱꜰᴜʟʟʏ
╰────────────────────╯

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`

        }, {
            quoted: message
        });

        // Success reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (err) {

        console.log('IMG SEARCH ERROR:', err);

        // Error message
        await sock.sendMessage(chatId, {
            text:
`╭───〔 ❌ ᴇʀʀᴏʀ 〕───╮
│ ⚠️ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ɪᴍᴀɢᴇ
│ 🌐 ᴄʜᴇᴄᴋ ɪɴᴛᴇʀɴᴇᴛ ᴏʀ ᴀᴘɪ
╰────────────────────╯

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`
        }, {
            quoted: message
        });

        // Error reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });

    }

}

module.exports = imgCommand;

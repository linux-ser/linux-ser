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
│ 📌 ᴇxᴀᴍᴘʟᴇ : .ɪᴍɢ ᴀɴɪᴍᴇ
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

        // Fetch relevant images
        const response = await axios.get(

            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3`,

            {
                headers: {
                    Authorization: apiKey
                }
            }

        );

        // No result
        if (!response.data.photos.length) {

            return await sock.sendMessage(chatId, {
                text:
`╭───〔 ❌ ɴᴏ ʀᴇꜱᴜʟᴛ 〕───╮
│ 🚫 ɴᴏ ɪᴍᴀɢᴇꜱ ᴡᴇʀᴇ ꜰᴏᴜɴᴅ
│ 🔍 ᴛʀʏ ᴀɴᴏᴛʜᴇʀ ǫᴜᴇʀʏ
╰────────────────────╯

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`
            }, {
                quoted: message
            });

        }

        // Best matching image
        const bestImage = response.data.photos[0];

        const imageUrl = bestImage.src.large;

        // Send image
        await sock.sendMessage(chatId, {

            image: {
                url: imageUrl
            },

            caption:
`╭───〔 📸 ɪᴍᴀɢᴇ ꜱᴇᴀʀᴄʜ 〕───╮
│ 🔍 Qᴜᴇʀʏ : ${query}
│ 🌐 Sᴏᴜʀᴄᴇ : ᴩᴇхᴇʟꜱ ᴀᴩɪ
│ ✅ ɪᴍᴀɢᴇ ꜰᴏᴜɴᴅ ꜱᴜᴄᴄᴇssꜰᴜʟʟʏ
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

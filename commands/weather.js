const axios = require('axios');

module.exports = async function (sock, chatId, message, city) {
    try {
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';

        // 🌦️ React Emoji
        await sock.sendMessage(chatId, {
            react: { text: '🌤️', key: message.key }
        });

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
        );

        const weather = response.data;

        const weatherText = `
╭───〔 ᴡᴇᴀᴛʜᴇʀ 〕───╮
│🌤️╭───────────────
│🌤️│  ✦ ᴄɪᴛʏ: ${weather.name}, ${weather.sys.country}
│🌤️│  ✦ ᴛᴇᴍᴩ: ${weather.main.temp}°C
│🌤️│  ✦ ꜰᴇᴇʟꜱ: ${weather.main.feels_like}°C
│🌤️│  ✦ ʜᴜᴍɪᴅ: ${weather.main.humidity}%
│🌤️│  ✦ ᴡɪɴᴅ: ${weather.wind.speed} m/s
│🌤️│
│🌤️│  ✦ ꜱᴛᴀᴛᴜꜱ: ${weather.weather[0].description} ✅
│🌤️╰───────────────
╰────────────────────╯

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊
`;

        await sock.sendMessage(
            chatId,
            { text: weatherText },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error fetching weather:', error);

        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        await sock.sendMessage(
            chatId,
            {
                text: `
╭───〔 ❌ ᴡᴇᴀᴛʜᴇʀ ᴇʀʀᴏʀ 〕───╮
│ Unable to fetch weather data.
│ Please check the city name.
╰────────────────────╯
`
            },
            { quoted: message }
        );
    }
};

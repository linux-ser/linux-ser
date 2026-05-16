const axios = require('axios');

module.exports = async function (sock, chatId) {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        });
        
        const joke = response.data.joke;

        // --- NEW DESIGNED TEXT ---
        const styledJoke = `╭───〔 🤡 𝐃𝐀𝐃 𝐉𝐎𝐊𝐄 〕───╮
│
│✺ ${joke}
│
╰───────────────────╯`;

        await sock.sendMessage(chatId, { text: styledJoke });

    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ *Error:* Could not fetch a joke at this moment.' 
        });
    }
};

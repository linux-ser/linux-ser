const fetch = require('node-fetch');

module.exports = async function quoteCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/quotes?apikey=${shizokeys}`);
        
        if (!res.ok) throw new Error('API Response Error');
        
        const json = await res.json();
        
        // --- FIX LOGIC ---
        // Some APIs return json.result as an object {quote, author}
        // Others return it as a string. This handles both.
        let quoteText = "";
        let author = "Unknown";

        if (typeof json.result === 'object') {
            quoteText = json.result.quote || json.result.text || "No quote found";
            author = json.result.author || "Unknown";
        } else {
            quoteText = json.result || "No quote found";
        }

        // --- AURA MD DESIGNED TEXT ---
        const styledQuote = `╭───〔 ❝ 𝐐𝐔𝐎𝐓𝐄 ❞ 〕───╮
│
│✺ *“ ${quoteText} ”*
│
│  - _${author}_
│
╰───────────────────╯`;

        await sock.sendMessage(chatId, { text: styledQuote }, { quoted: message });

    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ *Error:* Failed to fetch quote. Please try again.' 
        }, { quoted: message });
    }
};

const os = require('os');
const settings = require('../settings.js');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);

    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();

        // ⚡ Reaction on user message
        await sock.sendMessage(chatId, {
            react: {
                text: '⚡',
                key: message.key
            }
        });

        // Checking message
        const tempMsg = await sock.sendMessage(
            chatId,
            { text: '⚡ Checking speed...' },
            { quoted: message }
        );

        const end = Date.now();
        const ping = end - start;

        const uptime = formatTime(process.uptime());

        const now = new Date();

        // 🇮🇳 FORCE INDIA TIMEZONE (IMPORTANT FIX)
        const date = now.toLocaleDateString('en-GB', {
            timeZone: 'Asia/Kolkata'
        });

        const time = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        let speedStatus = '🟢⚡ Fast';

        if (ping > 600) {
            speedStatus = '🔴 Slow';
        } else if (ping > 300) {
            speedStatus = '🟡 Normal';
        }

        const pingText = `
╭──〔 🛰 𝗣𝗜𝗡𝗚 𝗥𝗘𝗣𝗢𝗥𝗧 〕──╮
│
│ 🕐 𝙍𝙚𝙨𝙥𝙤𝙣𝙨𝙚   :  ${ping} ms
│ 📡 𝙎𝙩𝙖𝙩𝙪𝙨         :  ${speedStatus}
│ 🤖 𝘽𝙤𝙩 𝙉𝙖𝙢𝙚  :  𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️
│ 🔖 𝙑𝙚𝙧𝙨𝙞𝙤𝙣      :  v${settings.version}
│ ⏳ 𝙐𝙥𝙩𝙞𝙢𝙚       :  ${uptime}
│ 📅 𝘿𝙖𝙩𝙚           :  ${date}
│ ⏰ 𝙏𝙞𝙢𝙚           :    ${time}
│
╰───────────────⌁

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡
`.trim();

        // Optional tiny delay for better UX feel
        await new Promise(r => setTimeout(r, 120));

        await sock.sendMessage(chatId, {
            text: pingText,
            edit: tempMsg.key
        });

    } catch (error) {
        console.error('Error in ping command:', error);

        await sock.sendMessage(
            chatId,
            { text: '❌ Failed to get ping report.' },
            { quoted: message }
        );
    }
}

module.exports = pingCommand;

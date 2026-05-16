const fs = require('fs');

const ANTICALL_PATH = './data/anticall.json';

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch {}
}

async function anticallCommand(sock, chatId, message, args) {
    const state = readState();
    const sub = (args || '').trim().toLowerCase();

    if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
        await sock.sendMessage(chatId, { text: '*ᴀɴᴛɪᴄᴀʟʟ*\n\n*.ᴀɴᴛɪᴄᴀʟʟ ᴏɴ*  - ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏ-ʙʟᴏᴄᴋ ᴏɴ ɪɴᴄᴏᴍɪɴɢ ᴄᴀʟʟꜱ\n*.ᴀɴᴛɪᴄᴀʟʟ ᴏꜰꜰ* - ᴅɪꜱᴀʙʟᴇ ᴀɴᴛɪᴄᴀʟʟ\n*.ᴀɴᴛɪᴄᴀʟʟ ꜱᴛᴀᴛᴜꜱ* - ꜱʜᴏᴡ ᴄᴜʀʀᴇɴᴛ ꜱᴛᴀᴛᴜꜱ' }, { quoted: message });
        return;
    }

    if (sub === 'status') {
        await sock.sendMessage(chatId, { text: `ᴀɴᴛɪᴄᴀʟʟ ɪꜱ ᴄᴜʀʀᴇɴᴛʟʏ *${state.enabled ? 'ᴏɴ' : 'ᴏꜰꜰ'}*.` }, { quoted: message });
        return;
    }

    const enable = sub === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { text: `ᴀɴᴛɪᴄᴀʟʟ ᴜꜱ ɴᴏᴡ *${enable ? 'ᴇɴᴀʙʟᴇᴅ' : 'ᴅɪꜱᴀʙʟᴇᴅ'}*.` }, { quoted: message });
}

module.exports = { anticallCommand, readState };



const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/autoreact.json');

// Random emojis
const emojis = [
    '😀','😎','🔥','❤️','💀','🥶','⚡','💯','🤣','🥳',
    '😈','🤖','👀','🎉','😹','🤍','🫡','😏','😴','🤩',
    '🍀','🌚','🌝','🐐','🚀','🎶','🧠','🍁','🍕','☠️',
    '👑','💥','😇','🙈','🙉','🙊','💖','✨','🌟','🎯'
];

// Create file if missing
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        enabled: false
    }, null, 2));
}

// Load state
function getState() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE));
    } catch {
        return { enabled: false };
    }
}

// Save state
function saveState(state) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// Random emoji
function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// AUTO REACT
async function addCommandReaction(sock, message) {
    try {
        const state = getState();

        if (!state.enabled) return;
        if (!message?.key) return;

        // Ignore status
        if (message.key.remoteJid === 'status@broadcast') return;

        await sock.sendMessage(
            message.key.remoteJid,
            {
                react: {
                    text: getRandomEmoji(),
                    key: message.key
                }
            }
        );

    } catch (err) {
        console.log('AutoReact Error:', err.message);
    }
}

// COMMAND
async function handleAreactCommand(sock, chatId, message, isOwner) {

    if (!isOwner) {
        return await sock.sendMessage(chatId, {
            text: '❌ Owner only command'
        }, {
            quoted: message
        });
    }

    const body =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        '';

    const args = body.split(' ');
    const option = args[1]?.toLowerCase();

    const state = getState();

    if (option === 'on') {

        state.enabled = true;
        saveState(state);

        return await sock.sendMessage(chatId, {
            text: '✅ AutoReact enabled'
        }, {
            quoted: message
        });

    } else if (option === 'off') {

        state.enabled = false;
        saveState(state);

        return await sock.sendMessage(chatId, {
            text: '❌ AutoReact disabled'
        }, {
            quoted: message
        });

    } else {

        return await sock.sendMessage(chatId, {
            text:
`╭──〔 AUTO REACT 〕──╮
│
│ .autoreact on
│ .autoreact off
│
╰──────────────────╯`
        }, {
            quoted: message
        });
    }
}

module.exports = {
    addCommandReaction,
    handleAreactCommand
};

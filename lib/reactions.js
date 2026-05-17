const fs = require('fs');
const path = require('path');

// Big random emoji list
const commandEmojis = [
    '😀','😎','🔥','❤️','💀','🥶','⚡','💯','🤣','🥳',
    '😈','🤖','👀','🎉','😹','🤍','🫡','😏','😴','🤩',
    '🍀','🌚','🌝','🐐','🚀','🎶','🧠','🍁','🍕','☠️',
    '👑','💥','😇','🙈','🙉','🙊','💖','✨','🌟','🎯',
    '😡','😭','😱','🤯','😜','🤡','🍻','💎','🐼','🐸'
];

// Path for storing auto-reaction state
const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// Load auto-reaction state
function loadAutoReactionState() {
    try {
        if (fs.existsSync(USER_GROUP_DATA)) {
            const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
            return data.autoReaction || false;
        }
    } catch (error) {
        console.error('Error loading auto-reaction state:', error);
    }

    return false;
}

// Save auto-reaction state
function saveAutoReactionState(state) {
    try {
        const data = fs.existsSync(USER_GROUP_DATA)
            ? JSON.parse(fs.readFileSync(USER_GROUP_DATA))
            : { groups: [], chatbot: {} };

        data.autoReaction = state;

        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving auto-reaction state:', error);
    }
}

// Auto reaction state
let isAutoReactionEnabled = loadAutoReactionState();

// Get random emoji
function getRandomEmoji() {
    return commandEmojis[Math.floor(Math.random() * commandEmojis.length)];
}

// React to ANY message automatically
async function addCommandReaction(sock, message) {
    try {
        if (!isAutoReactionEnabled) return;
        if (!message?.key?.id) return;

        // Ignore bot messages
        if (message.key.fromMe) return;

        const emoji = getRandomEmoji();

        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: emoji,
                key: message.key
            }
        });

    } catch (error) {
        console.error('Error adding command reaction:', error);
    }
}

// Handle .autoreact command
async function handleAreactCommand(sock, chatId, message, isOwner) {
    try {
        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is only available for the owner!',
                quoted: message
            });
            return;
        }

        const body = message.message?.conversation || '';
        const args = body.split(' ');
        const action = args[1]?.toLowerCase();

        if (action === 'on') {
            isAutoReactionEnabled = true;
            saveAutoReactionState(true);

            await sock.sendMessage(chatId, {
                text: '✅ AutoReact Enabled Successfully\n\nBot will now react with random emojis after every message.',
                quoted: message
            });

        } else if (action === 'off') {
            isAutoReactionEnabled = false;
            saveAutoReactionState(false);

            await sock.sendMessage(chatId, {
                text: '✅ AutoReact Disabled Successfully',
                quoted: message
            });

        } else {
            const status = isAutoReactionEnabled ? 'ON ✅' : 'OFF ❌';

            await sock.sendMessage(chatId, {
                text:
`╭──〔 AUTO REACT 〕──╮
│
│ Status : ${status}
│
│ Commands:
│ .autoreact on
│ .autoreact off
│
╰──────────────────╯`,
                quoted: message
            });
        }

    } catch (error) {
        console.error('Error handling areact command:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Error controlling auto reactions',
            quoted: message
        });
    }
}

module.exports = {
    addCommandReaction,
    handleAreactCommand
};

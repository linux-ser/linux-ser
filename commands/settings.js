const fs = require('fs');

function readJsonSafe(path, fallback) {
    try {
        const txt = fs.readFileSync(path, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

const isOwnerOrSudo = require('../lib/isOwner');

async function settingsCommand(sock, chatId, message) {
    try {
        // ⚙️ Settings Reaction
        await sock.sendMessage(chatId, {
            react: { text: '⚙️', key: message.key }
        });
        
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '❌ Only bot owner can use this command!' }, { quoted: message });
            return;
        }

        const isGroup = chatId.endsWith('@g.us');
        const dataDir = './data';

        const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
        const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
        const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
        const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
        const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
        const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
        const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}
        });
        const autoReaction = Boolean(userGroupData.autoReaction);

        const groupId = isGroup ? chatId : null;

        let settingsMsg = `╭───〔 ⚙️ 𝐁𝐎𝐓 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 〕───╮\n│\n`;
        settingsMsg += `│ ✦ 𝐌𝐨𝐝𝐞 : ${mode.isPublic ? 'Public' : 'Private'}\n`;
        settingsMsg += `│ ✦ 𝐀𝐮𝐭𝐨 𝐒𝐭𝐚𝐭𝐮𝐬 : ${autoStatus.enabled ? '✅' : '❌'}\n`;
        settingsMsg += `│ ✦ 𝐀𝐮𝐭𝐨𝐫𝐞𝐚𝐝 : ${autoread.enabled ? '✅' : '❌'}\n`;
        settingsMsg += `│ ✦ 𝐀𝐮𝐭𝐨𝐭𝐲𝐩𝐢𝐧𝐠 : ${autotyping.enabled ? '✅' : '❌'}\n`;
        settingsMsg += `│ ✦ 𝐏𝐌 𝐁𝐥𝐨𝐜𝐤𝐞𝐫 : ${pmblocker.enabled ? '✅' : '❌'}\n`;
        settingsMsg += `│ ✦ 𝐀𝐧𝐭𝐢𝐜𝐚𝐥𝐥 : ${anticall.enabled ? '✅' : '❌'}\n`;
        settingsMsg += `│ ✦ 𝐀𝐮𝐭𝐨 𝐑𝐞𝐚𝐜𝐭 : ${autoReaction ? '✅' : '❌'}\n`;
        settingsMsg += `│\n╰────────────────────╯\n\n`;

        if (groupId) {
            const antilinkOn = Boolean(userGroupData.antilink && userGroupData.antilink[groupId]);
            const antibadwordOn = Boolean(userGroupData.antibadword && userGroupData.antibadword[groupId]);
            const welcomeOn = Boolean(userGroupData.welcome && userGroupData.welcome[groupId]);
            const goodbyeOn = Boolean(userGroupData.goodbye && userGroupData.goodbye[groupId]);
            const chatbotOn = Boolean(userGroupData.chatbot && userGroupData.chatbot[groupId]);
            const antitagCfg = (userGroupData.antitag && userGroupData.antitag[groupId]);

            settingsMsg += `╭───〔 👥 𝐆𝐑𝐎𝐔𝐏 𝐂𝐎𝐍𝐅𝐈𝐆 〕───╮\n│\n`;
            settingsMsg += `│ ✦ 𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤 : ${antilinkOn ? '✅' : '❌'}\n`;
            settingsMsg += `│ ✦ 𝐀𝐧𝐭𝐢𝐛𝐚𝐝𝐰𝐨𝐫𝐝 : ${antibadwordOn ? '✅' : '❌'}\n`;
            settingsMsg += `│ ✦ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 : ${welcomeOn ? '✅' : '❌'}\n`;
            settingsMsg += `│ ✦ 𝐆𝐨𝐨𝐝𝐛𝐲𝐞 : ${goodbyeOn ? '✅' : '❌'}\n`;
            settingsMsg += `│ ✦ 𝐂𝐡𝐚𝐭𝐛𝐨𝐭 : ${chatbotOn ? '✅' : '❌'}\n`;
            settingsMsg += `│ ✦ 𝐀𝐧𝐭𝐢𝐭𝐚𝐠 : ${antitagCfg?.enabled ? '✅' : '❌'}\n`;
            settingsMsg += `│\n╰────────────────────╯`;
        } else {
            settingsMsg += `_Note: Use in a group to see group-specific settings._`;
        }

        await sock.sendMessage(chatId, { text: settingsMsg }, { quoted: message });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to read settings.' }, { quoted: message });
    }
}

module.exports = settingsCommand;

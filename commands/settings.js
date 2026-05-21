const fs = require('fs');

function readJsonSafe(
    path,
    fallback
) {

    try {

        const txt =
        fs.readFileSync(
            path,
            'utf8'
        );

        return JSON.parse(txt);

    }

    catch (_) {

        return fallback;

    }

}

const isOwnerOrSudo =
require('../lib/isOwner');

// ======================
// SETTINGS COMMAND
// ======================

async function settingsCommand(
    sock,
    chatId,
    message
) {

    try {

        // ======================
        // REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {

                text: '⚙️',
                key: message.key

            }

        });

        // ======================
        // OWNER CHECK
        // ======================

        const senderId =

            message.key.participant ||

            message.key.remoteJid;

        const isOwner =
        await isOwnerOrSudo(

            senderId,
            sock,
            chatId

        );

        if (
            !message.key.fromMe &&
            !isOwner
        ) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 ❌ Access Denied 〕━━━╮
┃ ✦ Only bot owner
┃ ✦ can use this command
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // GROUP CHECK
        // ======================

        const isGroup =
        chatId.endsWith('@g.us');

        const dataDir =
        './data';

        // ======================
        // READ FILES
        // ======================

        const mode =
        readJsonSafe(

`${dataDir}/messageCount.json`,

            { isPublic: true }

        );

        const autoStatus =
        readJsonSafe(

`${dataDir}/autoStatus.json`,

            { enabled: false }

        );

        const autoread =
        readJsonSafe(

`${dataDir}/autoread.json`,

            { enabled: false }

        );

        const autotyping =
        readJsonSafe(

`${dataDir}/autotyping.json`,

            { enabled: false }

        );

        const pmblocker =
        readJsonSafe(

`${dataDir}/pmblocker.json`,

            { enabled: false }

        );

        const anticall =
        readJsonSafe(

`${dataDir}/anticall.json`,

            { enabled: false }

        );

        const userGroupData =
        readJsonSafe(

`${dataDir}/userGroupData.json`,

            {

                antilink: {},
                antibadword: {},
                welcome: {},
                goodbye: {},
                chatbot: {},
                antitag: {},
                autoReaction: {
                    enabled: false
                }

            }

        );

        // ======================
        // FIXED AUTOREACTION
        // ======================

        const autoReaction =

            userGroupData
            .autoReaction
            ?.enabled || false;

        const groupId =
        isGroup ? chatId : null;

        // ======================
        // SETTINGS MESSAGE
        // ======================

        let settingsMsg =

`╭━━━〔 ⚙️ BOT SETTINGS 〕━━━╮
┃
┃ 🌐 Mode : ${mode.isPublic ? 'Public 🌍' : 'Private 🔒'}
┃ 📸 Auto Status : ${autoStatus.enabled ? '✅' : '❌'}
┃ 👀 Autoread : ${autoread.enabled ? '✅' : '❌'}
┃ ⌨️ Autotyping : ${autotyping.enabled ? '✅' : '❌'}
┃ 🚫 PM Blocker : ${pmblocker.enabled ? '✅' : '❌'}
┃ 📞 Anticall : ${anticall.enabled ? '✅' : '❌'}
┃ 😀 Auto React : ${autoReaction ? '✅' : '❌'}
┃
╰━━━━━━━━━━━━━━━━━━╯`;

        // ======================
        // GROUP SETTINGS
        // ======================

        if (groupId) {

            const antilinkOn =
            Boolean(

                userGroupData.antilink &&

                userGroupData
                .antilink[groupId]

            );

            const antibadwordOn =
            Boolean(

                userGroupData.antibadword &&

                userGroupData
                .antibadword[groupId]

            );

            const welcomeOn =
            Boolean(

                userGroupData.welcome &&

                userGroupData
                .welcome[groupId]

            );

            const goodbyeOn =
            Boolean(

                userGroupData.goodbye &&

                userGroupData
                .goodbye[groupId]

            );

            const chatbotOn =
            Boolean(

                userGroupData.chatbot &&

                userGroupData
                .chatbot[groupId]

            );

            const antitagCfg =

                userGroupData.antitag &&

                userGroupData
                .antitag[groupId];

            settingsMsg +=

`\n\n╭━━━〔 👥 GROUP SETTINGS 〕━━━╮
┃
┃ 🔗 Antilink : ${antilinkOn ? '✅' : '❌'}
┃ 🚫 Antibadword : ${antibadwordOn ? '✅' : '❌'}
┃ 👋 Welcome : ${welcomeOn ? '✅' : '❌'}
┃ 🥀 Goodbye : ${goodbyeOn ? '✅' : '❌'}
┃ 🤖 Chatbot : ${chatbotOn ? '✅' : '❌'}
┃ 🏷️ Antitag : ${antitagCfg?.enabled ? '✅' : '❌'}
┃
╰━━━━━━━━━━━━━━━━━━╯`;

        }

        else {

            settingsMsg +=

`\n\n╭━━━〔 ℹ️ Notice 〕━━━╮
┃ ✦ Use this command
┃ ✦ inside a group to
┃ ✦ see group settings
╰━━━━━━━━━━━━━━━━━━╯`;

        }

        // ======================
        // SEND MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
            settingsMsg

        }, { quoted: message });

        // ======================
        // SUCCESS REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {

                text: '✅',
                key: message.key

            }

        });

    }

    catch (error) {

        console.error(
            'Error in settings command:',
            error
        );

        // ======================
        // ERROR REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {

                text: '❌',
                key: message.key

            }

        });

        // ======================
        // ERROR MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Settings Error 〕━━━╮
┃ ✦ Failed to load
┃ ✦ bot settings
┃
┃ ✦ Try again later
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = settingsCommand;

const isAdmin = require('../lib/isAdmin');

// ======================
// MEMORY
// ======================

const recentDemotions =
new Set();

// ======================
// DEMOTE COMMAND
// ======================

async function demoteCommand(
    sock,
    chatId,
    mentionedJids,
    message
) {

    try {

        if (!chatId.endsWith('@g.us')) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 ❌ Group Only 〕━━━╮
┃ ✦ This command only works
┃ ✦ inside WhatsApp groups
╰━━━━━━━━━━━━━━━━━━╯`

            });

        }

        // ======================
        // ADMIN CHECK
        // ======================

        const adminStatus =
        await isAdmin(

            sock,
            chatId,
            message.key.participant
            || message.key.remoteJid

        );

        if (!adminStatus.isBotAdmin) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🤖 Bot Admin 〕━━━╮
┃ ✦ Please make bot admin
┃ ✦ to use this command
╰━━━━━━━━━━━━━━━━━━╯`

            });

        }

        if (!adminStatus.isSenderAdmin) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🚫 Access Denied 〕━━━╮
┃ ✦ Only group admins
┃ ✦ can use .demote
╰━━━━━━━━━━━━━━━━━━╯`

            });

        }

        // ======================
        // GET USER
        // ======================

        let userToDemote = [];

        if (
            mentionedJids &&
            mentionedJids.length > 0
        ) {

            userToDemote =
            mentionedJids;

        }

        else if (

            message.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.participant

        ) {

            userToDemote = [

                message.message
                .extendedTextMessage
                .contextInfo
                .participant

            ];

        }

        // ======================
        // NO USER
        // ======================

        if (userToDemote.length === 0) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 ⬇️ Demote User 〕━━━╮
┃ ✦ Mention or reply
┃ ✦ to a user
┃ ✦ Example:
┃ ✦ .demote @user
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '⬇️',
                key: message.key
            }

        });

        // ======================
        // SAVE TEMP
        // ======================

        userToDemote.forEach(jid => {

            recentDemotions.add(jid);

            setTimeout(() => {

                recentDemotions.delete(jid);

            }, 5000);

        });

        // ======================
        // DEMOTE
        // ======================

        await sock.groupParticipantsUpdate(

            chatId,
            userToDemote,
            "demote"

        );

        // ======================
        // FORMAT
        // ======================

        const usernames =
        userToDemote.map(

            jid =>
            `@${jid.split('@')[0]}`

        );

        const demoterJid =
        message.key.participant
        || message.key.remoteJid;

        const indianDate =
        new Date().toLocaleDateString(
            'en-GB',
            {
                timeZone:
                'Asia/Kolkata'
            }
        );

        const indianTime =
        new Date().toLocaleTimeString(
            'en-US',
            {
                timeZone:
                'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
        );

        // ======================
        // MESSAGE
        // ======================

        const demotionMessage =

`╭──〔 ⬇️ 𝗗𝗘𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮
│
│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Success
│ 👤 𝘿𝙚𝙢𝙤𝙩𝙚𝙙 𝙐𝙨𝙚𝙧  :  ${usernames.join(', ')}
│ 👑 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  @${demoterJid.split('@')[0]}
│ 📅 𝘿𝙖𝙩𝙚           :  ${indianDate}
│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}
│
╰───────────────⌁

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        await sock.sendMessage(chatId, {

            text:
            demotionMessage,

            mentions: [
                ...userToDemote,
                demoterJid
            ]

        });

    } catch (error) {

        console.log(error);

        await sock.sendMessage(chatId, {

            text:
'❌ Failed to demote user.'

        });

    }

}

// ======================
// EVENT DETECTION
// ======================

async function handleDemotionEvent(
    sock,
    groupId,
    participants,
    author
) {

    try {

        if (
            !Array.isArray(participants)
        ) return;

        // ======================
        // SKIP COMMAND DEMOTE
        // ======================

        const filtered =
        participants.filter(

            jid =>
            !recentDemotions.has(jid)

        );

        if (filtered.length === 0)
        return;

        const users =
        filtered.map(

            jid =>
            `@${jid.split('@')[0]}`

        );

        let mentionList =
        [...filtered];

        let demotedBy =
        'System';

        if (author) {

            demotedBy =
            `@${author.split('@')[0]}`;

            mentionList.push(author);

        }

        const indianDate =
        new Date().toLocaleDateString(
            'en-GB',
            {
                timeZone:
                'Asia/Kolkata'
            }
        );

        const indianTime =
        new Date().toLocaleTimeString(
            'en-US',
            {
                timeZone:
                'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
        );

        const detectMessage =

`╭──〔 ⬇️ 𝗗𝗘𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮
│
│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Detected
│ 👤 𝘿𝙚𝙢𝙤𝙩𝙚𝙙 𝙐𝙨𝙚𝙧  :  ${users.join(', ')}
│ 👑 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  ${demotedBy}
│ 📅 𝘿𝙖𝙩𝖊           :  ${indianDate}
│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}
│
╰───────────────⌁

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        await sock.sendMessage(groupId, {

            text:
            detectMessage,

            mentions:
            mentionList

        });

    } catch (err) {

        console.log(err);

    }

}

module.exports = {

    demoteCommand,
    handleDemotionEvent

};

const { isAdmin } = require('../lib/isAdmin');

// ======================
// MEMORY
// ======================

const recentPromotions =
new Set();

// ======================
// PROMOTE COMMAND
// ======================

async function promoteCommand(
    sock,
    chatId,
    mentionedJids,
    message
) {

    try {

        // ======================
        // GROUP CHECK
        // ======================

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
        // GET USER
        // ======================

        let userToPromote = [];

        if (
            mentionedJids &&
            mentionedJids.length > 0
        ) {

            userToPromote =
            mentionedJids;

        }

        else if (

            message.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.participant

        ) {

            userToPromote = [

                message.message
                .extendedTextMessage
                .contextInfo
                .participant

            ];

        }

        // ======================
        // NO USER
        // ======================

        if (userToPromote.length === 0) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 👑 Promote User 〕━━━╮
┃ ✦ Mention or reply
┃ ✦ to a user
┃ ✦ Example:
┃ ✦ .promote @user
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: message });

        }

        // ======================
        // REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '👑',
                key: message.key
            }

        });

        // ======================
        // SAVE TEMP
        // ======================

        userToPromote.forEach(jid => {

            recentPromotions.add(jid);

            setTimeout(() => {

                recentPromotions.delete(jid);

            }, 5000);

        });

        // ======================
        // PROMOTE
        // ======================

        await sock.groupParticipantsUpdate(

            chatId,
            userToPromote,
            "promote"

        );

        // ======================
        // FORMAT
        // ======================

        const usernames =
        userToPromote.map(

            jid =>
            `@${jid.split('@')[0]}`

        );

        const promoterJid =
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

        const promotionMessage =

`╭──〔 👑 𝗣𝗥𝗢𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮
│
│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Success
│ 👥 𝙉𝙚𝙬 𝘼𝙙𝙢𝙞𝙣   :  ${usernames.join(', ')}
│ 👤 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  @${promoterJid.split('@')[0]}
│ 📅 𝘿𝙖𝙩𝖊           :  ${indianDate}
│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}
│
╰───────────────⌁

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        await sock.sendMessage(chatId, {

            text:
            promotionMessage,

            mentions: [
                ...userToPromote,
                promoterJid
            ]

        });

    } catch (error) {

        console.error(error);

        await sock.sendMessage(chatId, {

            text:
'❌ Failed to promote user.'

        });

    }

}

// ======================
// EVENT DETECTION
// ======================

async function handlePromotionEvent(
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
        // SKIP COMMAND PROMOTE
        // ======================

        const filtered =
        participants.filter(

            jid =>
            !recentPromotions.has(jid)

        );

        if (filtered.length === 0)
        return;

        const promotedUsers =
        filtered.map(

            jid =>
            `@${jid.split('@')[0]}`

        );

        let mentionList =
        [...filtered];

        let promotedBy =
        'System';

        if (author) {

            promotedBy =
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

        const promotionMessage =

`╭──〔 👑 𝗣𝗥𝗢𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮
│
│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Detected
│ 👥 𝙉𝙚𝙬 𝘼𝙙𝙢𝙞𝙣   :  ${promotedUsers.join(', ')}
│ 👤 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  ${promotedBy}
│ 📅 𝘿𝙖𝙩𝖊           :  ${indianDate}
│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}
│
╰───────────────⌁

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        await sock.sendMessage(groupId, {

            text:
            promotionMessage,

            mentions:
            mentionList

        });

    } catch (error) {

        console.error(error);

    }

}

module.exports = {

    promoteCommand,
    handlePromotionEvent

};

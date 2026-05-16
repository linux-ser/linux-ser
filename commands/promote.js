const { isAdmin } = require('../lib/isAdmin');

/**
 * കമാൻഡ് വഴി മാനുവൽ ആയി പ്രൊമോട്ട് ചെയ്യുമ്പോൾ (.promote / .pm)
 */
async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];
    
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Please mention a user or reply to their message to promote them!*'
        }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
        
        const usernames = userToPromote.map(jid => `@${jid.split('@')[0]}`);
        const promoterJid = message.key.participant || message.key.remoteJid;

        // 🇮🇳 Indian Time (IST) Settings
        const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
        const dateOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        
        const indianDate = new Date().toLocaleDateString('en-GB', dateOptions);
        const indianTime = new Date().toLocaleTimeString('en-US', options);

        // ✨ Boxed Border Style Report
        const promotionMessage = 
            `╭──〔 👑 𝗣𝗥𝗢𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮\n` +
            `│\n` +
            `│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Success\n` +
            `│ 👥 𝙉𝙚𝙬 𝘼𝙙𝙢𝙞𝙣   :  ${usernames.join(', ')}\n` +
            `│ 👤 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  @${promoterJid.split('@')[0]}\n` +
            `│ 📅 𝘿𝙖𝙩𝖊           :  ${indianDate}\n` +
            `│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}\n` +
            `│\n` +
            `╰───────────────⌁\n\n` +
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        await sock.sendMessage(chatId, { 
            text: promotionMessage,
            mentions: [...userToPromote, promoterJid]
        });

    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: '❌ *Failed to promote user(s). Make sure the bot is an admin!*' }, { quoted: message });
    }
}

/**
 * ഗ്രൂപ്പിൽ ആരെങ്കിലും മാനുവൽ അല്ലാതെ പ്രൊമോട്ട് ചെയ്യുമ്പോൾ ബോട്ട് തനിയെ ഡിറ്റക്ട് ചെയ്യുന്നത്
 */
async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;

        const promotedUsernames = participants.map(jid => {
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            return `@${jidString.split('@')[0]}`;
        });

        let promotedBy = 'System';
        let mentionList = participants.map(jid => typeof jid === 'string' ? jid : (jid.id || jid.toString()));

        if (author) {
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        }

        // 🇮🇳 Indian Time (IST) Settings
        const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
        const dateOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        
        const indianDate = new Date().toLocaleDateString('en-GB', dateOptions);
        const indianTime = new Date().toLocaleTimeString('en-US', options);

        // ✨ Boxed Border Style Report for Events
        const promotionMessage = 
            `╭──〔 👑 𝗣𝗥𝗢𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮\n` +
            `│\n` +
            `│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Detected\n` +
            `│ 👥 𝙉𝙚𝙬 𝘼𝙙𝙢𝙞𝙣   :  ${promotedUsernames.join(', ')}\n` +
            `│ 👤 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  ${promotedBy}\n` +
            `│ 📅 𝘿𝙖𝙩𝖊           :  ${indianDate}\n` +
            `│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}\n` +
            `│\n` +
            `╰───────────────⌁\n\n` +
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;
        
        await sock.sendMessage(groupId, {
            text: promotionMessage,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Error handling promotion event:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };

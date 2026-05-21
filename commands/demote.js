const isAdmin = require('../lib/isAdmin');

/**
 * കമാൻഡ് വഴി മാനുവൽ ആയി ഡിമോട്ട് ചെയ്യുമ്പോൾ (.demote / .dm)
 */
async function demoteCommand(sock, chatId, mentionedJids, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: 'This command can only be used in groups!'
            });
            return;
        }

        try {
            const adminStatus = await isAdmin(sock, chatId, message.key.participant || message.key.remoteJid);
            
            if (!adminStatus.isBotAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ Error: Please make the bot an admin first to use this command.'
                });
                return;
            }

            if (!adminStatus.isSenderAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ Error: Only group admins can use the demote command.'
                });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            await sock.sendMessage(chatId, { 
                text: '❌ Error: Please make sure the bot is an admin of this group.'
            });
            return;
        }

        let userToDemote = [];
        
        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        
        if (userToDemote.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '❌ Error: Please mention the user or reply to their message to demote!'
            });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        await sock.groupParticipantsUpdate(chatId, userToDemote, "demote");
        
        const usernames = await Promise.all(userToDemote.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        const demoterJid = message.key.participant || message.key.remoteJid;
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 🇮🇳 Indian Time Zone Settings (IST)
        const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
        const dateOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        
        const indianDate = new Date().toLocaleDateString('en-GB', dateOptions);
        const indianTime = new Date().toLocaleTimeString('en-US', options);

        const demotionMessage = 
            `╭──〔 ⬇️ 𝗗𝗘𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮\n` +
            `│\n` +
            `│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Success\n` +
            `│ 👤 𝘿𝙚𝙢𝙤𝙩𝙚𝙙 𝙐𝙨𝙚𝙧  :  ${usernames.join(', ')}\n` +
            `│ 👑 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  @${demoterJid.split('@')[0]}\n` +
            `│ 📅 𝘿𝙖𝙩𝙚           :  ${indianDate}\n` +
            `│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}\n` +
            `│\n` +
            `╰───────────────⌁\n\n` +
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;
        
        await sock.sendMessage(chatId, { 
            text: demotionMessage,
            mentions: [...userToDemote, demoterJid]
        });
    } catch (error) {
        console.error('Error in demote command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { text: '❌ Rate limit reached. Please try again.' });
            } catch {}
        } else {
            try {
                await sock.sendMessage(chatId, { text: '❌ Failed to demote user(s).' });
            } catch {}
        }
    }
}

/**
 * ഗ്രൂപ്പിൽ ആരെങ്കിലും മാനുവൽ അല്ലാതെ ഡിമോട്ട് ചെയ്യുമ്പോൾ ബോട്ട് തനിയെ ഡിറ്റക്ട് ചെയ്യുന്നത്
 */
async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;

        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotedUsernames = await Promise.all(participants.map(async jid => {
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            return `@${jidString.split('@')[0]}`;
        }));

        let demotedBy = 'System';
        let mentionList = participants.map(jid => typeof jid === 'string' ? jid : (jid.id || jid.toString()));

        if (author && author.length > 0) {
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            demotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 🇮🇳 Indian Time Zone Settings (IST)
        const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
        const dateOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        
        const indianDate = new Date().toLocaleDateString('en-GB', dateOptions);
        const indianTime = new Date().toLocaleTimeString('en-US', options);

        const demotionMessage = 
            `╭──〔 ⬇️ 𝗗𝗘𝗠𝗢𝗧𝗜𝗢𝗡 〕──╮\n` +
            `│\n` +
            `│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Detected\n` +
            `│ 👤 𝘿𝙚𝙢𝙤𝙩𝙚𝙙 𝙐𝙨𝙚𝙧  :  ${demotedUsernames.join(', ')}\n` +
            `│ 👑 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  ${demotedBy}\n` +
            `│ 📅 𝘿𝙖𝙩𝖊           :  ${indianDate}\n` +
            `│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}\n` +
            `│\n` +
            `╰───────────────⌁\n\n` +
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;
        
        await sock.sendMessage(groupId, {
            text: demotionMessage,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Error handling demotion event:', error);
    }
}

module.exports = { demoteCommand, handleDemotionEvent };

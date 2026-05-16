const isAdmin = require('../lib/isAdmin');

/**
 * ബോട്ടിന്റെ Bio / About മാറ്റാനുള്ള കമാൻഡ് (.setbio <text>)
 */
async function setBioCommand(sock, chatId, message, senderId) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        
        // കമാൻഡിനൊപ്പം നൽകിയ ബയോ ടെക്സ്റ്റ് വേർതിരിച്ചെടുക്കുന്നു
        const bioText = parts.slice(1).join(' ');

        if (!bioText) {
            await sock.sendMessage(chatId, { 
                text: '❌ *Error: Please provide a text to set as bio!*\n\n*Usage:* `.setbio Your New Bio Here`' 
            }, { quoted: message });
            return;
        }

        // ഗ്രൂപ്പിലാണെങ്കിൽ മാത്രം അഡ്മിൻ ചെക്കിങ് നടത്തുന്നു
        if (chatId.endsWith('@g.us')) {
            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ *Error: Only group admins can change the bot bio!*' 
                }, { quoted: message });
                return;
            }
        }

        // WhatsApp സെർവറിൽ ബയോ അപ്ഡേറ്റ് ചെയ്യുന്നു
        await sock.updateProfileStatus(bioText);

        // 🇮🇳 Indian Time (IST) Settings
        const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
        const dateOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        
        const indianDate = new Date().toLocaleDateString('en-GB', dateOptions);
        const indianTime = new Date().toLocaleTimeString('en-US', options);

        // ✨ അതേ പ്രൊഫഷണൽ ബോക്സ് സ്റ്റൈൽ റിപ്പോർട്ട് ലേഔട്ട്
        const bioReportMessage = 
            `╭─〔 ⚙️ 𝗕𝗜𝗢 𝗨𝗣𝗗𝗔𝗧𝗘 〕─╮\n` +
            `│\n` +
            `│ 📝 𝙎𝙩𝙖𝙩𝙪𝙨         :  ✅ Changed\n` +
            `│ 💬 𝙉𝙚w 𝘽𝙞𝙤       :  ${bioText}\n` +
            `│ 👑 𝘼𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙  :  @${senderId.split('@')[0]}\n` +
            `│ 📅 𝘿𝙖𝙩𝖊           :  ${indianDate}\n` +
            `│ ⏰ 𝙏𝙞𝙢𝙚           :  ${indianTime}\n` +
            `│\n` +
            `╰───────────────⌁\n\n` +
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ ⚡`;

        await sock.sendMessage(chatId, { 
            text: bioReportMessage,
            mentions: [senderId]
        });

    } catch (error) {
        console.error('Error in setbio command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ *Failed to update bio. Please try again later!*' 
        }, { quoted: message });
    }
}

module.exports = setBioCommand;

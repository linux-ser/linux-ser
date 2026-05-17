async function groupInfoCommand(sock, chatId, msg) {
    try {
        // ബോട്ട് താൽക്കാലികമായി 📊 റിയാക്ഷൻ നൽകുന്നു
        try { 
            await sock.sendMessage(chatId, { react: { text: "📊", key: msg.key } }); 
        } catch {}

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // Get group profile picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image
        }

        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        
        // അഡ്മിൻമാരുടെ ലിസ്റ്റ് ബോക്സ് സ്റ്റൈലിലേക്ക് മാറ്റുന്നു
        const listAdmin = groupAdmins.map((v, i) => `│    ${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        // 🇮🇳 Indian Time (IST) Settings
        const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
        const dateOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        
        const indianDate = new Date().toLocaleDateString('en-GB', dateOptions);
        const indianTime = new Date().toLocaleTimeString('en-US', options);

        // ✨ നിങ്ങളുടെ സ്ഥിരം പ്രൊഫഷണൽ ബോക്സ് സ്റ്റൈൽ ലേഔട്ട്
        const text = 
            `╭───〔 📊 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢 〕───╮\n` +
            `│\n` +
            `│ 📝 *𝙂𝙧𝙤𝙪𝙥 𝙉𝙖𝙢𝙚* : ${groupMetadata.subject}\n` +
            `│ 🆔 *𝙂𝙧𝙤𝙪𝙥 𝙄𝘿* : ${groupMetadata.id}\n` +
            `│ 👑 *𝙂𝙧𝙤𝙪𝙥 𝙊𝙬𝙣𝙚𝙧* : @${owner.split('@')[0]}\n` +
            `│ 👥 *𝙏𝙤𝙩𝙖𝙡 𝙈𝙚𝙢𝙗𝙚𝙧𝙨* : [ ${participants.length} ]\n` +
            `│\n` +
            `│ 📅 *𝙁𝙚𝙩𝙘𝙝𝙚𝙙 𝘿𝙖𝙩𝙚* : ${indianDate}\n` +
            `│ ⏰ *𝙁𝙚𝙩𝙘𝙝𝙚𝙙 𝙏𝙞𝙢𝙚* : ${indianTime}\n` +
            `│\n` +
            `├────〔 🕵🏻‍♂️ 𝗔𝗗𝗠𝗜𝗡𝗦 〕────┤\n` +
            `${listAdmin}\n` +
            `│\n` +
            `├───〔 📌 𝗗𝗘𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡 〕───┤\n` +
            `│ ${groupMetadata.desc?.toString() || 'No description available for this group.'}\n` +
            `│\n` +
            `╰─────────────────────⌁\n\n` +
            `ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`;

        // Send the message with image and mentions
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner]
        }, { quoted: msg });

        // സക്സസ് റിയാക്ഷൻ
        try { 
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } }); 
        } catch {}

    } catch (error) {
        console.error('❌ Error in groupInfoCommand:', error);
        try { 
            await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } }); 
        } catch {}
    }
}

module.exports = { groupInfoCommand };

const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {

        // 💚 Alive Reaction
        await sock.sendMessage(chatId, {
            react: { text: "💚", key: message.key }
        });

        const aliveText = `
╭━━━〔 *𝐋ɪɴᴜх 𝐒ᴇʀ* 〕━━━╮
┃ 🟢 *ʙᴏᴛ ꜱᴛᴀᴛᴜꜱ:* ᴏɴʟɪɴᴇ
┃ ⚡ *ᴠᴇʀꜱɪᴏɴ:* ${settings.version || "3.0.7"}
┃ 🌐 *ᴍᴏᴅᴇ:* ᴩᴜʙʟɪᴄ
┃ 🕒 *ʀᴜɴᴛɪᴍᴇ:* ᴀᴄᴛɪᴠᴇ
╰━━━━━━━━━━━━━━╯

╭──〔 🚀 ꜰᴇᴀᴛᴜʀᴇꜱ 〕──╮
┃ ✦ ɢʀᴏᴜᴩ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ
┃ ✦ ᴀɴᴛɪʟɪɴᴋ ᴩʀᴏᴛᴇᴄᴛɪᴏɴ
┃ ✦ ᴀᴜᴛᴏ ꜱᴛɪᴄᴋᴇʀ
┃ ✦ ᴀɪ ᴄᴏᴍᴍᴀɴᴅꜱ
┃ ✦ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ꜱʏꜱᴛᴇᴍ
┃ ✦ ꜰᴜɴ & ɢᴀᴍᴇꜱ
╰━━━━━━━━━━━━━━╯

╭──〔 📌 ɪɴꜰᴏ 〕──╮
┃ ✦ *ᴩʀᴇꜰɪx* : .
┃ ✦ *ᴏᴡɴᴇʀ* : 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️
┃ ✦ *ꜱᴛᴀᴛᴜꜱ* : ꜱᴛᴀʙʟᴇ ✅
╰━━━━━━━━━━━━━━╯

> ᴛʏᴘᴇ *.ᴍᴇɴᴜ* ᴛᴏ ꜱᴇᴇ ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅꜱ 🧃🕊️
`;

        await sock.sendMessage(
            chatId,
            {
                text: aliveText
            },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in alive command:", error);

        await sock.sendMessage(
            chatId,
            {
                text: "❌ Failed to check bot status."
            },
            { quoted: message }
        );
    }
}

module.exports = aliveCommand;

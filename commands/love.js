module.exports = async function loveCommand(sock, chatId, message) {
    try {
        // 1. ആദ്യം ഒരൊറ്റ ഇമോജി മാത്രം സെൻഡ് ചെയ്യുന്നു
        const sentMsg = await sock.sendMessage(chatId, { text: "❤️" }, { quoted: message });

        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        
        // 2. ഇമോജികൾ ഓരോന്നായി മാറി വരാനുള്ള ലിസ്റ്റ് (നിങ്ങൾ പറഞ്ഞ ഓർഡറിൽ)
        const emojiSequence = ["🤍", "🤎", "🩵", "💚", "💙", "💜", "💛", "🧡", "🩷", "🖤"];

        // ഓരോ ഇമോജിയും വന്ന് കഴിഞ്ഞ് അത് എഡിറ്റ് ആയി അടുത്ത ഇമോജി വരുന്നു
        for (const frame of emojiSequence) {
            await delay(800); // ഇമോജി മാറുന്നതിന്റെ സ്പീഡ് (800 milliseconds)
            await sock.sendMessage(chatId, {
                text: frame,
                edit: sentMsg.key
            });
        }

        // 3. അവസാനം വരാൻ ആഗ്രഹിച്ച ടെക്സ്റ്റ് മാത്രം ലോഡ് ആവുന്നു
        await delay(1000);
        await sock.sendMessage(chatId, {
            text: "💌 𝐋ᴏᴠᴇ 𝐒ᴇɴᴛ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️",
            edit: sentMsg.key,
            mentions: [] // ആരെയും മെൻഷൻ ചെയ്യില്ല
        });

    } catch (error) {
        console.error("Love command handling error:", error);
        await sock.sendMessage(chatId, { text: "❌ Error while running love command" }, { quoted: message });
    }
};

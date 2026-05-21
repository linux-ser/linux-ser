const fetch = require('node-fetch');

async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        // Reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '🌐',
                key: message.key
            }
        });
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';

        // Check if it's a reply
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            // Get text from quoted message
            textToTranslate = quotedMessage.conversation || 
                            quotedMessage.extendedTextMessage?.text || 
                            quotedMessage.imageMessage?.caption || 
                            quotedMessage.videoMessage?.caption || 
                            '';

            // Get language from command
            lang = match.trim();
        } else {
            // Parse command arguments for direct message
            const args = match.trim().split(' ');
            if (args.length < 2) {
                return sock.sendMessage(chatId, {
                    text: `╭───〔 🌐 ᴛʀᴀɴꜱʟᴀᴛᴏʀ 〕───╮\n` +
                          `│ ❌ ɪɴꜱᴜꜰꜰɪᴄɪᴇɴᴛ ᴀʀɢᴜᴍᴇɴᴛ...` +
                          `│\n` +
                          `│ 📖 *ᴜꜱᴀɢᴇ:*\n` +
                          `│ 1. ʀᴇᴘʟʏ: \`.translate <ʟᴀɴɢ>\`\n` +
                          `│ 2. ᴅɪʀᴇᴄᴛ: \`.translate <ᴛᴇxᴛ> <ʟᴀɴɢ>\`\n` +
                          `│\n` +
                          `│ 🌐 *ʟᴀɴɢᴜᴀɢᴇ ᴄᴏᴅᴇ|:*\n` +
                          `│ 🇺🇸 en - English    🇪🇸 es - Spanish\n` +
                          `│ 🇫🇷 fr - French     🇩🇪 de - German\n` +
                          `│ 🇮🇹 it - Italian    🇵🇹 pt - Portuguese\n` +
                          `│ 🇷🇺 ru - Russian    🇯🇵 ja - Japanese\n` +
                          `│ 🇰🇷 ko - Korean     🇨🇳 zh - Chinese\n` +
                          `│ 🇸🇦 ar - Arabic     🇮🇳 hi - Hindi\n` +
                          `│ 🇮🇳 ml - Malayalam  🇮🇳 ta - Tamil\n` +
                          `│ 🇮🇩 id - Indonesian 🇹🇷 tr - Turkish\n` +
                          `│ 🇻🇳 vi - Vietnamese 🇳🇱 nl - Dutch\n` +
                          `│\n` +
                          `│ 💡 *ᴇхᴀᴍᴘʟᴇ:*\n` +
                          `│ \`.translate hello ta\`\n` +
                          `╰────────────────────╯\n\n` +
                          `ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`,
                    quoted: message
                });
            }

            lang = args.pop(); // Get language code
            textToTranslate = args.join(' '); // Get text to translate
        }

        if (!textToTranslate) {
            return sock.sendMessage(chatId, {
                text: `╭───〔 🌐 ᴛʀᴀɴꜱʟᴀᴛᴏʀ 〕───╮\n` +
                      `│ ❌ ɴᴏ ᴛᴇxᴛ ꜰᴏᴜɴᴅ ᴛᴏ ᴛʀᴀɴꜱʟᴀᴛᴇ\n` +
                      `╰────────────────────╯\n\n` +
                      `ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`,
                quoted: message
            });
        }

        // Try multiple translation APIs in sequence
        let translatedText = null;
        let error = null;

        // Try API 1 (Google Translate API)
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    translatedText = data[0][0][0];
                }
            }
        } catch (e) {
            error = e;
        }

        // If API 1 fails, try API 2
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.responseData && data.responseData.translatedText) {
                        translatedText = data.responseData.translatedText;
                    }
                }
            } catch (e) {
                error = e;
            }
        }

        // If API 2 fails, try API 3
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.translated) {
                        translatedText = data.translated;
                    }
                }
            } catch (e) {
                error = e;
            }
        }

        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        // Formatted Success Response
        const successMessage = `╭───〔 🌐 ᴛʀᴀɴꜱʟᴀᴛɪᴏɴ 〕───╮\n` +
                               `│ 📥 *ɪɴᴘᴜᴛ:* ${textToTranslate}\n` +
                               `│\n` +
                               `│ 🎯 *ᴛᴀʀɢᴇᴛ:* ${lang.toUpperCase()}\n` +
                               `│ ✨ *ʀᴇꜱᴜʟᴛ:* ${translatedText}\n` +
                               `╰────────────────────╯\n\n` +
                               `ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`;

        // Send translation
        await sock.sendMessage(chatId, {
            text: successMessage,
        }, {
            quoted: message
        });
        // Success Reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

    } catch (error) {
        console.error('❌ Error in translate command:', error);
        //Error Reaction
        await sock.sendMessage(chatId, {
            react: {
                text: '❌',
                key: message.key
            }
        });
        
        await sock.sendMessage(chatId, {
            text: `╭───〔 🌐 ᴛʀᴀɴꜱʟᴀᴛᴏʀ 〕───╮\n` +
                  `│ ❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴛʀᴀɴ<b>ꜱʟᴀᴛᴇ ᴛᴇxᴛ\n` +
                  `│ ᴘʟᴇᴀ<b>ꜱᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.\n` +
                  `╰────────────────────╯\n\n` +
                  `ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`,
            quoted: message
        });
    }
}

module.exports = {
    handleTranslateCommand
};

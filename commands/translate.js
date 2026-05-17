const fetch = require('node-fetch');

async function handleTranslateCommand(sock, chatId, message, match) {
    try {
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
                          `│ ❌ ɪɴꜱᴜꜰꜰɪᴄɪᴇɴᴛ ᴀʀɢᴜᴍᴇɴᴛ\n` +
                          `│\n` +
                          `│ 📖 *ᴜꜱᴀɢᴇ:*\n` +
                          `│ 1. ʀᴇᴘʟʏ: \`.translate <ʟᴀɴɢ>\`\n` +
                          `│ 2. ᴅɪʀᴇᴄᴛ: \`.translate <ᴛᴇxᴛ> <ʟᴀɴɢ>\`\n` +
                          `│\n` +
                          `│ 🌐 *ʟᴀɴɢᴜᴀɢᴇ ᴄᴏᴅᴇꜱ:*\n` +
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
                          `│ 💡 *ᴇxᴀᴍᴘʟᴇ:*\n` +
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
                text: `╭───〔 🌐 ᴛʀᴀɴ<b>ꜱʟᴀᴛᴏʀ 〕───╮\n` +
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

        // Output Text formatting
        const successText = `╭───〔 🌐 ᴛʀᴀɴꜱʟᴀᴛɪᴏɴ 〕───╮\n` +
                            `│ 📥 *ɪɴᴘᴜᴛ:* ${textToTranslate}\n` +
                            `│ 🎯 *ᴛᴀʀɢᴇᴛ:* ${lang.toUpperCase()}\n` +
                            `│\n` +
                            `│ ✨ *ʀᴇꜱᴜʟᴛ:* ${translatedText}\n` +
                            `╰────────────────────╯\n\n` +
                            `ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`;

        // Modern Baileys View-Once Interactive Message with Direct Copy Button Component
        const buttonMessage = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: successText },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📋 Copy Result",
                                        id: "copy_translation",
                                        copy_code: translatedText
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        };

        // Send message with the native dynamic flow action button
        await sock.sendMessage(chatId, buttonMessage, { quoted: message });

    } catch (error) {
        console.error('❌ Error in translate command:', error);
        await sock.sendMessage(chatId, {
            text: `╭───〔 🌐 ᴛʀᴀɴꜱʟᴀᴛᴏʀ 〕───╮\n` +
                  `│ ❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴛʀᴀɴꜱʟᴀᴛᴇ ᴛᴇxᴛ\n` +
                  `│ ᴘʟᴇᴀꜱᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.\n` +
                  `╰────────────────────╯\n\n` +
                  `ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃✨`,
            quoted: message
        });
    }
}

module.exports = {
    handleTranslateCommand
};

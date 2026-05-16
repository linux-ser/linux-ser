const isAdmin = require('../lib/isAdmin');
const store = require('../lib/lightweight_store');

async function deleteCommand(sock, chatId, message, senderId) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        // ബോട്ട് അഡ്മിൻ അല്ലെങ്കിൽ റിയാക്ഷൻ വഴി ❌ കാണിക്കുന്നു
        if (!isBotAdmin) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
            return;
        }

        // കമാൻഡ് അടിച്ച ആൾ അഡ്മിൻ അല്ലെങ്കിൽ റിയാക്ഷൻ വഴി ❌ കാണിക്കുന്നു
        if (!isSenderAdmin) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        let countArg = null;
        
        if (parts.length > 1) {
            const maybeNum = parseInt(parts[1], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) {
                countArg = Math.min(maybeNum, 50);
            }
        }
        
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const repliedParticipant = ctxInfo.participant || null;
        const repliedMsgId = ctxInfo.stanzaId || null;
        const mentioned = Array.isArray(ctxInfo.mentionedJid) && ctxInfo.mentionedJid.length > 0 ? ctxInfo.mentionedJid[0] : null;
        
        if (countArg === null && !repliedMsgId && !mentioned) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
            return;
        }

        const toDelete = [];

        // ടാഗ് ചെയ്ത മെസ്സേജ് മാത്രം എടുക്കുന്നു
        if (repliedMsgId && repliedParticipant) {
            toDelete.push({
                id: repliedMsgId,
                participant: repliedParticipant
            });
        } 
        // വ്യക്തിയെ മെൻഷൻ ചെയ്താൽ
        else if (mentioned && countArg > 0) {
            const chatMessages = Array.isArray(store.messages[chatId]) ? store.messages[chatId] : [];
            const seenIds = new Set();
            
            for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < countArg; i--) {
                const m = chatMessages[i];
                const participant = m.key.participant || m.key.remoteJid;
                if (participant === mentioned && !seenIds.has(m.key.id)) {
                    if (!m.message?.protocolMessage) {
                        toDelete.push({
                            id: m.key.id,
                            participant: participant
                        });
                        seenIds.add(m.key.id);
                    }
                }
            }
        } 
        // വെറുതെ നമ്പർ മാത്രം നൽകിയാൽ
        else if (countArg > 0) {
            const chatMessages = Array.isArray(store.messages[chatId]) ? store.messages[chatId] : [];
            const seenIds = new Set();
            
            for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < countArg; i--) {
                const m = chatMessages[i];
                if (!seenIds.has(m.key.id)) {
                    if (!m.message?.protocolMessage && !m.key.fromMe && m.key.id !== message.key.id) {
                        toDelete.push({
                            id: m.key.id,
                            participant: m.key.participant || m.key.remoteJid
                        });
                        seenIds.add(m.key.id);
                    }
                }
            }
        }

        if (toDelete.length === 0) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
            return;
        }

        // 🚀 ആദ്യ ഘട്ടം: ഡിലീറ്റ് പ്രൊസെസ്സ് തുടങ്ങുമ്പോൾ തന്നെ 🗑️ ഇമോജി റിയാക്ട് ചെയ്യുന്നു
        try { 
            await sock.sendMessage(chatId, { react: { text: "🗑️", key: message.key } }); 
        } catch {}

        let deletedCount = 0;

        for (const m of toDelete) {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: m.id,
                        participant: m.participant
                    }
                });
                deletedCount++;
                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                // error bypass
            }
        }

        // 🚀 അവസാന ഘട്ടം: റിസൾട്ട് അനുസരിച്ച് ഇമോജി മാറ്റുന്നു
        if (deletedCount > 0) {
            // വിജയകരമായി ഡിലീറ്റ് ആയാൽ 🗑️ മാറ്റി ✅ (Tick) റിയാക്ഷൻ ഇടുന്നു
            try {
                await sock.sendMessage(chatId, {
                    react: {
                        text: "✅",
                        key: message.key
                    }
                });
            } catch (re) {}
        } else {
            // ഡിലീറ്റ് ആയില്ലെങ്കിൽ 🗑️ മാറ്റി ❌ (Into) റിയാക്ഷൻ ഇടുന്നു
            try {
                await sock.sendMessage(chatId, {
                    react: {
                        text: "❌",
                        key: message.key
                    }
                });
            } catch (re) {}
        }

    } catch (err) {
        try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
    }
}

module.exports = deleteCommand;

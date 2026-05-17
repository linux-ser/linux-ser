const isAdmin = require('../lib/isAdmin');
const store = require('../lib/lightweight_store');

async function deleteCommand(sock, chatId, message, senderId) {
    try {
        // ബോട്ട് റിയാക്ഷൻ താൽക്കാലികമായി 🗑️ ഇട്ടുകൊണ്ട് തുടക്കം കുറിക്കുന്നു
        try { 
            await sock.sendMessage(chatId, { react: { text: "🗑️", key: message.key } }); 
        } catch {}

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        // ബോട്ട് അഡ്മിൻ അല്ലെങ്കിൽ റിയാക്ഷൻ വഴി ❌ കാണിക്കുന്നു
        if (!isBotAdmin) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
            return;
        }

        // കമാൻഡ് അടിച്ച ആൾ അഡ്മിൻ അല്ലെങ്കിൽ ബോട്ട് ഓണർ ആണോ എന്ന് നോക്കുന്നു
        if (!isSenderAdmin && !message.key.fromMe) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        let countArg = null;
        
        if (parts.length > 1) {
            const maybeNum = parseInt(parts[1], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) {
                countArg = Math.min(maybeNum, 50); // പരമാവധി 50 മെസ്സേജുകൾ
            }
        }
        
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const repliedParticipant = ctxInfo.participant || null;
        const repliedMsgId = ctxInfo.stanzaId || null;

        let toDelete = [];

        // കേസ് 1: ഒരു പ്രത്യേക മെസ്സേജിന് റിപ്ലൈ ആയി കമാൻഡ് അടിക്കുമ്പോൾ
        if (repliedMsgId) {
            toDelete.push({
                id: repliedMsgId,
                participant: repliedParticipant
            });
        } 
        // കേസ് 2: ഒന്നിനും റിപ്ലൈ ചെയ്യാതെ അക്കങ്ങൾ നൽകുമ്പോൾ (.delete 5)
        else if (countArg) {
            // സ്റ്റോറിൽ നിന്നും മെസ്സേജ് ലിസ്റ്റ് സുരക്ഷിതമായി എടുക്കുന്നു
            let chatMessages = [];
            if (store && store.messages && store.messages[chatId]) {
                chatMessages = store.messages[chatId].array || store.messages[chatId] || [];
            }

            if (chatMessages.length > 0) {
                // ഗ്രൂപ്പിലെ അവസാനത്തെ മെസ്സേജുകൾ ഫിൽട്ടർ ചെയ്ത് എടുക്കുന്നു
                const sliceMsgs = chatMessages.slice(-countArg);
                for (const m of sliceMsgs) {
                    if (m.key && m.key.id) {
                        toDelete.push({
                            id: m.key.id,
                            participant: m.key.participant || m.participant || null
                        });
                    }
                }
            } else {
                // സ്റ്റോർ കാലിയാണെങ്കിൽ റിയാക്ഷൻ ❌ ആക്കുന്നു
                try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
                return;
            }
        } else {
            // ആർഗ്യുമെന്റും റിപ്ലൈയും ഇല്ലെങ്കിൽ റിയാക്ഷൻ ❌ ആക്കുന്നു
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
            return;
        }

        let deletedCount = 0;

        // ലൂപ്പ് വഴി ഓരോ മെസ്സേജുകളും ഡിലീറ്റ് ആക്കുന്നു
        for (const m of toDelete) {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: m.participant ? false : true,
                        id: m.id,
                        participant: m.participant
                    }
                });
                deletedCount++;
                await new Promise(r => setTimeout(r, 400)); // റേറ്റ് ലിമിറ്റ് ഒഴിവാക്കാൻ ചെറിയ സമയം നൽകുന്നു
            } catch (e) {
                console.error('Bypass delete entry error:', e.message);
            }
        }

        // ഫലം വിലയിരുത്തി റിയാക്ഷൻ അപ്ഡേറ്റ് ചെയ്യുന്നു
        if (deletedCount > 0) {
            try {
                await sock.sendMessage(chatId, {
                    react: {
                        text: "✅",
                        key: message.key
                    }
                });
            } catch (re) {}
        } else {
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
        console.error('❌ Serious Error in delete command:', err);
        try { 
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); 
        } catch {}
    }
}

module.exports = deleteCommand;

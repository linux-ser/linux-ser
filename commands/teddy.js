async function teddyCommand(sock, chatId, message) {

    const frames = [
String.raw`(\_/)
(•.•)
/ >❤️`,

String.raw`(\_/)
(•.•)
/ >🤍`,

String.raw`(\_/)
(•.•)
/ >🤎`,

String.raw`(\_/)
(•.•)
/ >🩷`,

String.raw`(\_/)
(•.•)
/ >💜`,

String.raw`(\_/)
(•.•)
/ >🧡`,

String.raw`(\_/)
(•.•)
/ >💛`,

String.raw`(\_/)
(•.•)
/ >💚`,

String.raw`(\_/)
(•.•)
/ >🩵`,

String.raw`(\_/)
(•.•)
/ >🖤`,

String.raw`(\_/)
(•.•)
/ >🧸`
];

    // First message
    const msg = await sock.sendMessage(chatId, {
        text: frames[0]
    }, { quoted: message });

    // Edit animation
    for (let i = 1; i < frames.length; i++) {

        await new Promise(resolve => setTimeout(resolve, 800));

        let finalText = frames[i];

        // Last frame add footer text
        if (i === frames.length - 1) {

            finalText = `🧸 𝐓ᴇᴅᴅʏ 𝐒ᴇɴᴛ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️`;
        }

        await sock.sendMessage(chatId, {
            edit: msg.key,
            text: finalText
        });

    }

}

module.exports = teddyCommand

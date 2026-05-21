const frames = [
`(\_/)
(•.•)
( >❤️`,

`(\_/)
(•.•)
( ❤️>)`,

`(\_/)
(•.•)
( >💖`,

`(\_/)
(•.•)
( 💖>)`,

`(\_/)
(•.•)
( >💕`,

`(\_/)
(•.•)
( 💕>)`
];

async function teddyCommand(sock, chatId, message) {

    const msg = await sock.sendMessage(chatId, {
        text: frames[0] + `\n\n*🧸 𝐓ᴇᴅᴅʏ 𝐒ᴇɴᴛ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*`
    }, { quoted: message });

    for (let i = 1; i < frames.length; i++) {

        await new Promise(resolve => setTimeout(resolve, 700));

        await sock.sendMessage(chatId, {
            edit: msg.key,
            text: frames[i] + `\n\n*🧸 𝐓ᴇᴅᴅʏ 𝐒ᴇɴᴛ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*`
        });

    }
}

module.exports = teddyCommand;

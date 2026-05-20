const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    // ⏳ Loading Reaction
    await sock.sendMessage(chatId, {
        react: { text: '📃', key: message.key }
    });

    // --- Fixed Indian Date & Time Logic ---
    const now = new Date();
    
    // Explicitly set the timezone to India (IST)
    const time = now.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });

    const date = now.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '-');

    // Get IST hours for the greeting logic
    const istHours = parseInt(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }));
    
    let greeting;
    if (istHours < 12) greeting = "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ ☀️";
    else if (istHours < 16) greeting = "ɢᴏᴏᴅ ᴀꜰᴛᴇʀɴᴏᴏɴ ✨";
    else if (istHours < 20) greeting = "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌆";
    else greeting = "ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙";

    const pushName = message.pushName || 'User';

    const helpMessage = `╭───〔 𝐌ᴇɴᴜ 〕───╮
│✺╭───────────────
│✺│  ✦ 𝐆ʀᴇᴇᴛɪɴɢ : ${greeting}
│✺│  ✦ 𝐎ᴡɴᴇʀ     : ${settings.ownerName || '𝐋ɪɴᴜх 𝐒ᴇʀ 👽📈'}
│✺│  ✦ 𝐔ꜱᴇʀ        : @${pushName}
│✺│  ✦ 𝐓ɪᴍᴇ         : ${time}
│✺│  ✦ 𝐃ᴀᴛᴇ        : ${date}
│✺│  ✦ 𝐏ʀᴇꜰɪх      : [ . ]
│✺│  ✦ 𝐂ᴍᴅꜱ       : 147
│✺╰───────────────
╰──────────────────╯

╭━━━❲ 𝐆ᴇɴᴇʀᴀʟ ❳━━━╮
┃ ✦ .help or .menu
┃ ✦ .ping
┃ ✦ .alive
┃ ✦ .owner
┃ ✦ .joke
┃ ✦ .quote
┃ ✦ .fact
┃ ✦ .weather <city>
┃ ✦ .news
┃ ✦ .lyrics <song_title>
┃ ✦ .8ball <question>
┃ ✦ .groupinfo
┃ ✦ .staff or .admins
┃ ✦ .vv
┃ ✦ .trt <text> <lang>
┃ ✦ .ss <link>
┃ ✦ .jid
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐀ᴅᴍɪɴ ❳━━━╮
┃ ✦ .ban @user
┃ ✦ .promote @user
┃ ✦ .demote @user
┃ ✦ .mute <minutes>
┃ ✦ .unmute
┃ ✦ .delete or .del
┃ ✦ .kick @user
┃ ✦ .warnings @user
┃ ✦ .warn @user
┃ ✦ .antilink
┃ ✦ .antibadword
┃ ✦ .clear
┃ ✦ .tag <message>
┃ ✦ .tagall
┃ ✦ .tagnotadmin
┃ ✦ .hidetag <message>
┃ ✦ .chatbot
┃ ✦ .resetlink
┃ ✦ .antitag <on/off>
┃ ✦ .welcome <on/off>
┃ ✦ .goodbye <on/off>
┃ ✦ .setgdesc <description>
┃ ✦ .setgname <new name>
┃ ✦ .setgpp (reply to image)
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐎ᴡɴᴇʀ ❳━━━╮
┃ ✦ .mode <public/private>
┃ ✦ .clearsession
┃ ✦ .antidelete
┃ ✦ .cleartmp
┃ ✦ .update
┃ ✦ .settings
┃ ✦ .setpp <reply to image>
┃ ✦ .autoreact <on/off>
┃ ✦ .autostatus <on/off>
┃ ✦ .autostatus react <on/off>
┃ ✦ .autotyping <on/off>
┃ ✦ .autoread <on/off>
┃ ✦ .anticall <on/off>
┃ ✦ .pmblocker <on/off/status>
┃ ✦ .pmblocker setmsg <text>
┃ ✦ .setmention <reply to msg>
┃ ✦ .mention <on/off>
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐈ᴍᴀɢᴇ/𝐒ᴛɪᴄᴋᴇʀ ❳━━━╮
┃ ✦ .blur <image>
┃ ✦ .simage <reply to sticker>
┃ ✦ .sticker <reply to image>
┃ ✦ .removebg
┃ ✦ .remini
┃ ✦ .crop <reply to image>
┃ ✦ .tgsticker <Link>
┃ ✦ .meme
┃ ✦ .take <packname>
┃ ✦ .emojimix <emj1>+<emj2>
┃ ✦ .igs <insta link>
┃ ✦ .igsc <insta link>
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐂ᴏɴᴠᴇʀᴛᴇʀ ❳━━━╮
┃ ✦ .tts <text>
┃ ✦ .attp <text>
┃ ✦ .url
┃ ✦ .tovn
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐏ɪᴇꜱ ❳━━━╮
┃ ✦ .pies <country>
┃ ✦ .china
┃ ✦ .indonesia
┃ ✦ .japan
┃ ✦ .korea
┃ ✦ .hijab
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐆ᴀᴍᴇ ❳━━━╮
┃ ✦ .tictactoe @user
┃ ✦ .hangman
┃ ✦ .guess <letter>
┃ ✦ .trivia
┃ ✦ .answer <answer>
┃ ✦ .truth
┃ ✦ .dare
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐀ɪ ❳━━━╮
┃ ✦ .gpt <question>
┃ ✦ .gemini <question>
┃ ✦ .imagine <prompt>
┃ ✦ .flux <prompt>
┃ ✦ .sora <prompt>
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐅ᴜɴ ❳━━━╮
┃ ✦ .compliment @user
┃ ✦ .insult @user
┃ ✦ .flirt
┃ ✦ .love
┃ ✦ .shayari
┃ ✦ .goodnight
┃ ✦ .roseday
┃ ✦ .character @user
┃ ✦ .wasted @user
┃ ✦ .ship @user
┃ ✦ .simp @user
┃ ✦ .stupid @user [text]
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐓ᴇꜱᴛᴍᴀᴋᴇʀ ❳━━━╮
┃ ✦ .metallic <text>
┃ ✦ .ice <text>
┃ ✦ .snow <text>
┃ ✦ .impressive <text>
┃ ✦ .matrix <text>
┃ ✦ .light <text>
┃ ✦ .neon <text>
┃ ✦ .devil <text>
┃ ✦ .purple <text>
┃ ✦ .thunder <text>
┃ ✦ .leaves <text>
┃ ✦ .1917 <text>
┃ ✦ .arena <text>
┃ ✦ .hacker <text>
┃ ✦ .sand <text>
┃ ✦ .blackpink <text>
┃ ✦ .glitch <text>
┃ ✦ .fire <text>
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐃ᴏᴡɴʟᴏᴀᴅᴇʀ ❳━━━╮
┃ ✦ .play <song_name>
┃ ✦ .song <song_name>
┃ ✦ .spotify <query>
┃ ✦ .img <query>
┃ ✦ .instagram <link>
┃ ✦ .facebook <link>
┃ ✦ .tiktok <link>
┃ ✦ .video <song name>
┃ ✦ .ytmp4 <Link>
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐌ɪꜱᴄ ❳━━━╮
┃ ✦ .heart
┃ ✦ .horny
┃ ✦ .circle
┃ ✦ .lgbt
┃ ✦ .lolice
┃ ✦ .its-so-stupid
┃ ✦ .namecard
┃ ✦ .oogway
┃ ✦ .tweet
┃ ✦ .ytcomment
┃ ✦ .comrade
┃ ✦ .gay
┃ ✦ .glass
┃ ✦ .jail
┃ ✦ .passed
┃ ✦ .triggered
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐀ɴɪᴍᴇ ❳━━━╮
┃ ✦ .nom
┃ ✦ .poke
┃ ✦ .cry
┃ ✦ .kiss
┃ ✦ .pat
┃ ✦ .hug
┃ ✦ .wink
┃ ✦ .facepalm
╰━━━━━━━━━━━━━━━━━━╯

╭━━━❲ 𝐆ɪᴛʜᴜʙ ❳━━━╮
┃ ✦ .git
┃ ✦ .github
┃ ✦ .sc
┃ ✦ .script
┃ ✦ .repo
╰━━━━━━━━━━━━━━━━━━╯
> 🧃 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋ɪɴᴜх 𝐒ᴇʀ 🕊🤍
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                mentions: [message.key.participant || message.key.remoteJid]
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: helpMessage,
                mentions: [message.key.participant || message.key.remoteJid]
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;

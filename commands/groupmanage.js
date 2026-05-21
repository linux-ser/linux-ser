const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function ensureGroupAndAdmin(
    sock,
    chatId,
    senderId
) {

    const isGroup =
    chatId.endsWith('@g.us');

    // ======================
    // GROUP CHECK
    // ======================

    if (!isGroup) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ⚠️ Group Only 〕━━━╮
┃ ✦ This command
┃ ✦ works only in groups
╰━━━━━━━━━━━━━━━━━━╯`

        });

        return { ok: false };

    }

    // ======================
    // ADMIN CHECK
    // ======================

    const isAdmin =
    require('../lib/isAdmin');

    const adminStatus =
    await isAdmin(
        sock,
        chatId,
        senderId
    );

    // ======================
    // BOT ADMIN CHECK
    // ======================

    if (!adminStatus.isBotAdmin) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 🤖 Bot Admin Required 〕━━━╮
┃ ✦ Please make
┃ ✦ bot admin first
╰━━━━━━━━━━━━━━━━━━━━━━╯`

        });

        return { ok: false };

    }

    // ======================
    // SENDER ADMIN CHECK
    // ======================

    if (!adminStatus.isSenderAdmin) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Access Denied 〕━━━╮
┃ ✦ Only group admins
┃ ✦ can use this command
╰━━━━━━━━━━━━━━━━━━╯`

        });

        return { ok: false };

    }

    return { ok: true };

}

// ======================
// SET GROUP DESCRIPTION
// ======================

async function setGroupDescription(
    sock,
    chatId,
    senderId,
    text,
    message
) {

    const check =
    await ensureGroupAndAdmin(
        sock,
        chatId,
        senderId
    );

    if (!check.ok) return;

    const desc =
    (text || '').trim();

    // ======================
    // NO DESCRIPTION
    // ======================

    if (!desc) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 📝 Set Group Description 〕━━━╮
┃ ✦ Please provide
┃ ✦ group description
┃
┃ 📌 Example:
┃ ✦ .setgdesc Hello
╰━━━━━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

        return;

    }

    try {

        // ======================
        // UPDATE DESCRIPTION
        // ======================

        await sock.groupUpdateDescription(
            chatId,
            desc
        );

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ✅ Description Updated 〕━━━╮
┃ ✦ Group description
┃ ✦ updated successfully
╰━━━━━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

    catch (e) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Update Failed 〕━━━╮
┃ ✦ Failed to update
┃ ✦ group description
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

// ======================
// SET GROUP NAME
// ======================

async function setGroupName(
    sock,
    chatId,
    senderId,
    text,
    message
) {

    const check =
    await ensureGroupAndAdmin(
        sock,
        chatId,
        senderId
    );

    if (!check.ok) return;

    const name =
    (text || '').trim();

    // ======================
    // NO NAME
    // ======================

    if (!name) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 🏷️ Set Group Name 〕━━━╮
┃ ✦ Please provide
┃ ✦ new group name
┃
┃ 📌 Example:
┃ ✦ .setgname 𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️
╰━━━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

        return;

    }

    try {

        // ======================
        // UPDATE GROUP NAME
        // ======================

        await sock.groupUpdateSubject(
            chatId,
            name
        );

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ✅ Name Updated 〕━━━╮
┃ ✦ Group name updated
┃ ✦ successfully
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

    catch (e) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Update Failed 〕━━━╮
┃ ✦ Failed to update
┃ ✦ group name
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

// ======================
// SET GROUP PHOTO
// ======================

async function setGroupPhoto(
    sock,
    chatId,
    senderId,
    message
) {

    const check =
    await ensureGroupAndAdmin(
        sock,
        chatId,
        senderId
    );

    if (!check.ok) return;

    const quoted =

        message.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.quotedMessage;

    const imageMessage =

        quoted?.imageMessage ||

        quoted?.stickerMessage;

    // ======================
    // NO IMAGE
    // ======================

    if (!imageMessage) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 🖼️ Set Group Photo 〕━━━╮
┃ ✦ Reply to image
┃ ✦ or sticker
┃
┃ 📌 Example:
┃ ✦ Reply image + .setgpp
╰━━━━━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

        return;

    }

    try {

        // ======================
        // TMP DIRECTORY
        // ======================

        const tmpDir =

        path.join(
            process.cwd(),
            'tmp'
        );

        if (
            !fs.existsSync(tmpDir)
        ) {

            fs.mkdirSync(

                tmpDir,

                {
                    recursive: true
                }

            );

        }

        // ======================
        // DOWNLOAD IMAGE
        // ======================

        const stream =

        await downloadContentFromMessage(
            imageMessage,
            'image'
        );

        let buffer =
        Buffer.from([]);

        for await (
            const chunk of stream
        ) {

            buffer =
            Buffer.concat([
                buffer,
                chunk
            ]);

        }

        const imgPath =

        path.join(

            tmpDir,

`gpp_${Date.now()}.jpg`

        );

        // ======================
        // SAVE IMAGE
        // ======================

        fs.writeFileSync(
            imgPath,
            buffer
        );

        // ======================
        // UPDATE PHOTO
        // ======================

        await sock.updateProfilePicture(

            chatId,

            {
                url: imgPath
            }

        );

        try {

            fs.unlinkSync(
                imgPath
            );

        }

        catch (_) {}

        // ======================
        // SUCCESS MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ✅ Group Photo Updated 〕━━━╮
┃ ✦ Group profile photo
┃ ✦ updated successfully
╰━━━━━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

    catch (e) {

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ Update Failed 〕━━━╮
┃ ✦ Failed to update
┃ ✦ group profile photo
╰━━━━━━━━━━━━━━━━━━╯`

        }, { quoted: message });

    }

}

module.exports = {

    setGroupDescription,
    setGroupName,
    setGroupPhoto

};

const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const isOwnerOrSudo = require('../lib/isOwner');

async function setProfilePicture(
    sock,
    chatId,
    msg
) {

    try {

        // ======================
        // OWNER CHECK
        // ======================

        const senderId =

            msg.key.participant ||

            msg.key.remoteJid;

        const isOwner =
        await isOwnerOrSudo(

            senderId,
            sock,
            chatId

        );

        if (
            !msg.key.fromMe &&
            !isOwner
        ) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 ❌ Access Denied 〕━━━╮
┃ ✦ Only bot owner
┃ ✦ can use this command
╰━━━━━━━━━━━━━━━━━━╯`

            });

        }

        // ======================
        // REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '🖼️',
                key: msg.key
            }

        });

        // ======================
        // CHECK REPLY
        // ======================

        const quotedMessage =

            msg.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage;

        if (!quotedMessage) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 🖼️ Set Profile Picture 〕━━━╮
┃ ✦ Reply to an image
┃ ✦ to update bot profile
┃
┃ 📌 Example:
┃ ✦ Reply image + .setpp
╰━━━━━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: msg });

        }

        // ======================
        // CHECK IMAGE
        // ======================

        const imageMessage =

            quotedMessage.imageMessage ||

            quotedMessage.stickerMessage;

        if (!imageMessage) {

            return await sock.sendMessage(chatId, {

                text:
`╭━━━〔 ⚠️ Invalid Reply 〕━━━╮
┃ ✦ Replied message
┃ ✦ must contain image
╰━━━━━━━━━━━━━━━━━━╯`

            }, { quoted: msg });

        }

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

        const imagePath =

        path.join(

            tmpDir,

`profile_${Date.now()}.jpg`

        );

        // ======================
        // SAVE IMAGE
        // ======================

        fs.writeFileSync(
            imagePath,
            buffer
        );

        // ======================
        // UPDATE PROFILE
        // ======================

        await sock.updateProfilePicture(

            sock.user.id,

            {
                url: imagePath
            }

        );

        // ======================
        // DELETE TEMP FILE
        // ======================

        try {

            fs.unlinkSync(
                imagePath
            );

        }

        catch (_) {}

        // ======================
        // SUCCESS MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ✅ Profile Updated 〕━━━╮
┃ ✦ Bot profile picture
┃ ✦ updated successfully
╰━━━━━━━━━━━━━━━━━━╯`

        });

        // ======================
        // SUCCESS REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '✅',
                key: msg.key
            }

        });

    }

    catch (error) {

        console.error(
            'Error in setpp command:',
            error
        );

        // ======================
        // ERROR REACTION
        // ======================

        await sock.sendMessage(chatId, {

            react: {
                text: '❌',
                key: msg.key
            }

        });

        // ======================
        // ERROR MESSAGE
        // ======================

        await sock.sendMessage(chatId, {

            text:
`╭━━━〔 ❌ SetPP Error 〕━━━╮
┃ ✦ Failed to update
┃ ✦ profile picture
┃
┃ ✦ Try again later
╰━━━━━━━━━━━━━━━━━━╯`

        });

    }

}

module.exports = setProfilePicture;

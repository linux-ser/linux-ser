const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const ffmpeg =
    require('fluent-ffmpeg');

const NodeID3 =
    require('node-id3');

const fs =
    require('fs');

const path =
    require('path');

async function slowedCommand(
    sock,
    chatId,
    message
) {

    try {

        const quoted =
            message.message
            ?.extendedTextMessage
            ?.contextInfo;

        if (
            !quoted ||
            !quoted.quotedMessage
        ) {

            return await sock.sendMessage(
                chatId,
                {
                    text:
`╭━━━〔 🎶 Slowed + Reverb 〕━━━╮
┃
┃ ✦ Reply to audio/video
┃ ✦ Then use:
┃ ✦ .slowed
┃
╰━━━━━━━━━━━━━━━━━━╯`
                },
                {
                    quoted: message
                }
            );

        }

        const qmsg =
            quoted.quotedMessage;

        let stream;
        let type;

        // ================= AUDIO =================

        if (qmsg.audioMessage) {

            stream =
                await downloadContentFromMessage(
                    qmsg.audioMessage,
                    'audio'
                );

            type = 'mp3';

        }

        // ================= VIDEO =================

        else if (
            qmsg.videoMessage
        ) {

            stream =
                await downloadContentFromMessage(
                    qmsg.videoMessage,
                    'video'
                );

            type = 'mp4';

        }

        else {

            return await sock.sendMessage(
                chatId,
                {
                    text:
`╭━━━〔 ❌ Invalid Media 〕━━━╮
┃
┃ ✦ Reply to:
┃ ✦ Audio or video only
┃
╰━━━━━━━━━━━━━━━━━━╯`
                },
                {
                    quoted: message
                }
            );

        }

        // ================= REACT =================

        await sock.sendMessage(
            chatId,
            {
                react: {
                    text: '🎶',
                    key: message.key
                }
            }
        );

        // ================= BUFFER =================

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

        // ================= TEMP =================

        const tempDir =
            path.join(
                __dirname,
                '../temp'
            );

        if (
            !fs.existsSync(tempDir)
        ) {

            fs.mkdirSync(
                tempDir,
                {
                    recursive: true
                }
            );

        }

        const timestamp =
            Date.now();

        const inputPath =
            path.join(
                tempDir,
                `input_${timestamp}.${type}`
            );

        const outputPath =
            path.join(
                tempDir,
                `output_${timestamp}.mp3`
            );

        fs.writeFileSync(
            inputPath,
            buffer
        );

        // ================= PROCESS =================

        await new Promise(
            (
                resolve,
                reject
            ) => {

                ffmpeg(inputPath)

                    .audioFilters([

                        'atempo=0.93',

                        'asetrate=44100*0.88',

                        'aresample=44100',

                        'aecho=0.8:0.88:60:0.4',

                        'bass=g=6:f=110:w=0.6',

                        'volume=1.15'

                    ])

                    .audioCodec(
                        'libmp3lame'
                    )

                    .audioBitrate(
                        '128k'
                    )

                    .format('mp3')

                    .save(outputPath)

                    .on(
                        'end',
                        resolve
                    )

                    .on(
                        'error',
                        reject
                    );

            }
        );

        // ================= CHECK =================

        if (
            !fs.existsSync(outputPath)
        ) {

            throw new Error(
                'Audio conversion failed'
            );

        }

        // ================= METADATA =================

        NodeID3.write({

            title:
                '♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ',

            artist:
                '𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️',

            album:
                '🎶 𝐕ɪʙᴇꜱ',

            performerInfo:
                '𝐋ɪɴᴜх 𝐒ᴇʀ',

            image: {

                mime:
                    'image/jpeg',

                type: {
                    id: 3,
                    name:
                        'front cover'
                },

                description:
                    'Cover',

                imageBuffer:
                    fs.readFileSync(
                        path.join(
                            __dirname,
                            '../assets/bot_image.jpg'
                        )
                    )

            }

        }, outputPath);

        // ================= SEND AUDIO =================

        await sock.sendMessage(
            chatId,
            {

                audio: {
                    url: outputPath
                },

                mimetype:
                    'audio/mpeg',

                ptt: false,

                seconds: 180,

                waveform:
                    [99,0,99,0,99,0,99],

                fileName:
                    'linuxser.mp3',

                jpegThumbnail:
                    fs.readFileSync(
                        path.join(
                            __dirname,
                            '../assets/bot_image.jpg'
                        )
                    )

            },
            {
                quoted: message
            }
        );

        // ================= SUCCESS =================

        await sock.sendMessage(
            chatId,
            {
                react: {
                    text: '✅',
                    key: message.key
                }
            }
        );

        // ================= CLEANUP =================

        setTimeout(() => {

            try {

                if (
                    fs.existsSync(
                        inputPath
                    )
                ) {

                    fs.unlinkSync(
                        inputPath
                    );

                }

                if (
                    fs.existsSync(
                        outputPath
                    )
                ) {

                    fs.unlinkSync(
                        outputPath
                    );

                }

            } catch (e) {

                console.log(e);

            }

        }, 120000);

    } catch (e) {

        console.log(
            'SLOWED ERROR:',
            e
        );

        await sock.sendMessage(
            chatId,
            {
                react: {
                    text: '❌',
                    key: message.key
                }
            }
        );

        await sock.sendMessage(
            chatId,
            {
                text:
`╭━━━〔 ❌ Error 〕━━━╮
┃
┃ ✦ ${e.message}
┃
╰━━━━━━━━━━━━━━━━━━╯`
            },
            {
                quoted: message
            }
        );

    }

}

module.exports =
    slowedCommand;

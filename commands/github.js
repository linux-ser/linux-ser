const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {

    // Fetch GitHub repo data
    const res = await fetch(
      'https://api.github.com/repos/linux-ser/Linux_ser'
    );

    if (!res.ok) {
      throw new Error('Error fetching repository data');
    }

    const json = await res.json();

    // Convert GitHub UTC time → Indian Time
    const indianTime = moment(json.updated_at)
      .tz('Asia/Kolkata')
      .format('hh:mm:ss A - DD/MM/YY');

    let txt = `*乂  𝐋ɪɴᴜх 𝐒ᴇʀ  乂*\n\n`;

    txt += `✩ *Name* : ${json.name}\n`;
    txt += `✩ *Watchers* : ${json.watchers_count}\n`;
    txt += `✩ *Size* : ${(json.size / 1024).toFixed(2)} MB\n`;
    txt += `✩ *Last Updated* : ${indianTime}\n`;
    txt += `✩ *URL* : ${json.html_url}\n`;
    txt += `✩ *Forks* : ${json.forks_count}\n`;
    txt += `✩ *Stars* : ${json.stargazers_count}\n\n`;

    txt += `*𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️*`;

    // Local image
    const imgPath = path.join(
      __dirname,
      '../assets/bot_image.jpg'
    );

    const imgBuffer = fs.readFileSync(imgPath);

    // Send message
    await sock.sendMessage(
      chatId,
      {
        image: imgBuffer,
        caption: txt
      },
      {
        quoted: message
      }
    );

  } catch (error) {

    console.error('GitHub Command Error:', error);

    await sock.sendMessage(
      chatId,
      {
        text: '❌ Error fetching repository information.'
      },
      {
        quoted: message
      }
    );
  }
}

module.exports = githubCommand;

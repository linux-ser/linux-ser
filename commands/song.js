const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');

async function songCommand(sock, chatId, message, args = []) {

	try {

		// ================= REACTION =================

		await sock.sendMessage(chatId, {
			react: {
				text: '🎵',
				key: message.key
			}
		});

		// ================= QUERY =================

		let query = '';

		if (
			Array.isArray(args) &&
			args.length > 0
		) {

			query = args.join(' ').trim();

		} else {

			query =
				message.message?.conversation ||
				message.message?.extendedTextMessage?.text ||
				'';

			query = query
				.replace(/^\.song\s*/i, '')
				.trim();
		}

		// ================= EMPTY =================

		if (!query) {

			return await sock.sendMessage(chatId, {
				text:
`╭━━━〔 🎵 Song Downloader 〕━━━╮
┃
┃ ✦ Please provide a song name
┃
┃ 📌 Example:
┃ ✦ .song faded
┃ ✦ .song believer
┃ ✦ .song alan walker
┃
╰━━━━━━━━━━━━━━━━━━╯`
			}, {
				quoted: message
			});
		}

		// ================= SEARCH =================

		await sock.sendMessage(chatId, {
			react: {
				text: '🔎',
				key: message.key
			}
		});

		const search =
			await yts(query);

		if (
			!search ||
			!search.videos.length
		) {

			return await sock.sendMessage(chatId, {
				text:
`╭━━━〔 ❌ Song Not Found 〕━━━╮
┃
┃ ✦ No matching songs found
┃ ✦ Try another keyword
┃
╰━━━━━━━━━━━━━━━━━━╯`
			}, {
				quoted: message
			});
		}

		const video =
			search.videos[0];

		// ================= DETAILS =================

		await sock.sendMessage(chatId, {

			image: {
				url: video.thumbnail
			},

			caption:
`╭━━━〔 🎧 Audio Details 〕━━━╮
┃
┃ ✦ 🎵 Title:
┃ ✦ ${video.title}
┃
┃ ✦ 🎤 Artist:
┃ ✦ ${video.author?.name || 'Unknown Artist'}
┃
┃ ✦ 💿 Album:
┃ ✦ ${video.author?.name || 'Unknown Album'}
┃
┃ ✦ ⏱ Duration:
┃ ✦ ${video.timestamp}
┃
┃ ✦ 📥 Status:
┃ ✦ Downloading Audio...
┃
╰━━━━━━━━━━━━━━━━━━╯`

		}, {
			quoted: message
		});

		// ================= API =================

		const api =
`https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;

		const apiRes =
			await axios.get(api);

		const audioUrl =
			apiRes.data?.data?.download_url;

		if (!audioUrl) {

			throw new Error(
				'No audio URL'
			);
		}

		// ================= DOWNLOAD =================

		const audioRes =
			await axios({
				method: 'GET',
				url: audioUrl,
				responseType: 'arraybuffer',
				timeout: 120000
			});

		const audioBuffer =
			Buffer.from(
				audioRes.data
			);

		if (
			!audioBuffer ||
			audioBuffer.length < 10000
		) {

			throw new Error(
				'Invalid audio'
			);
		}

		// ================= SAFE FILE NAME =================

		const safeTitle =
			video.title
				.replace(/[\\/:*?"<>|]/g, '')
				.substring(0, 80);

		const tempFile =
			path.join(
				__dirname,
`${safeTitle}.mp3`
			);

		// ================= SAVE FILE =================

		fs.writeFileSync(
			tempFile,
			audioBuffer
		);

		// ================= SEND AUDIO =================

		await sock.sendMessage(chatId, {

	audio: {
		url: tempFile
	},

	mimetype: 'audio/mpeg',

	fileName:
`${video.title
	.replace(/[\\/:*?"<>|]/g, '')
	.substring(0, 80)}.mp3`,

	ptt: false,

	title:
		video.title,

	performer:
		video.author?.name ||
		'Unknown Artist'

}, {
	quoted: message
});

		// ================= DELETE =================

		setTimeout(() => {

			if (
				fs.existsSync(tempFile)
			) {

				fs.unlinkSync(
					tempFile
				);
			}

		}, 30000);

		// ================= SUCCESS =================

		await sock.sendMessage(chatId, {
			react: {
				text: '✅',
				key: message.key
			}
		});

	} catch (err) {

		console.log(
			'Song Error:',
			err.message
		);

		await sock.sendMessage(chatId, {
			react: {
				text: '❌',
				key: message.key
			}
		});

		await sock.sendMessage(chatId, {
			text:
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃
┃ ✦ Unable to download audio
┃ ✦ Try another song later
┃
╰━━━━━━━━━━━━━━━━━━╯`
		}, {
			quoted: message
		});
	}
}

module.exports = songCommand;

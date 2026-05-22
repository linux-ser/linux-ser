const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

const AXIOS_DEFAULTS = {
	timeout: 60000,
	headers: {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	}
};

// ================= RETRY =================

async function tryRequest(getter, attempts = 3) {

	let lastError;

	for (let i = 1; i <= attempts; i++) {

		try {

			return await getter();

		} catch (err) {

			lastError = err;

			if (i < attempts) {

				await new Promise(r =>
					setTimeout(r, 1500)
				);
			}
		}
	}

	throw lastError;
}

// ================= DOWNLOAD API =================

async function getDownload(url) {

	const apis = [

`https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,

`https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(url)}`,

`https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(url)}`
	];

	for (const api of apis) {

		try {

			const res = await tryRequest(() =>
				axios.get(api, AXIOS_DEFAULTS)
			);

			// API 1
			if (
				res.data?.success &&
				res.data?.data?.download_url
			) {

				return res.data.data.download_url;
			}

			// API 2
			if (
				res.data?.result?.download
			) {

				return res.data.result.download;
			}

			// API 3
			if (
				res.data?.result?.download_url
			) {

				return res.data.result.download_url;
			}

		} catch {}
	}

	return null;
}

// ================= MAIN =================

async function songCommand(
	sock,
	chatId,
	message,
	args = []
) {

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

		let video;

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

		video = search.videos[0];

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
┃ ✦ YouTube Music
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

		// ================= AUDIO URL =================

		const audioUrl =
			await getDownload(video.url);

		if (!audioUrl) {

			throw new Error(
				'No audio URL'
			);
		}

		// ================= DOWNLOAD =================

		const response =
			await axios({
				method: 'GET',
				url: audioUrl,
				responseType: 'arraybuffer',
				timeout: 120000,
				headers: {
					'User-Agent':
						'Mozilla/5.0'
				}
			});

		const audioBuffer =
			Buffer.from(response.data);

		if (
			!audioBuffer ||
			audioBuffer.length < 10000
		) {

			throw new Error(
				'Invalid audio'
			);
		}

		// ================= SAVE TEMP FILE =================

		const tempFile =
			path.join(
				__dirname,
				`${Date.now()}.mp3`
			);

		fs.writeFileSync(
			tempFile,
			audioBuffer
		);

		// ================= SEND AUDIO =================

		await sock.sendMessage(chatId, {

			audio: {
				url: tempFile
			},

			mimetype:
				'audio/mpeg',

			fileName:
`${video.title}.mp3`,

			ptt: false

		}, {
			quoted: message
		});

		// ================= DELETE TEMP =================

		setTimeout(() => {

			if (
				fs.existsSync(tempFile)
			) {

				fs.unlinkSync(tempFile);
			}

		}, 15000);

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

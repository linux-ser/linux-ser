const axios = require('axios');
const yts = require('yt-search');

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

`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp3`,

`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`
	];

	for (const api of apis) {

		try {

			const res = await tryRequest(() =>
				axios.get(api, AXIOS_DEFAULTS)
			);

			// YUPRA
			if (
				res.data?.success &&
				res.data?.data?.download_url
			) {

				return res.data.data.download_url;
			}

			// ELITE
			if (
				res.data?.success &&
				res.data?.downloadURL
			) {

				return res.data.downloadURL;
			}

			// OKATSU
			if (res.data?.dl) {

				return res.data.dl;
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

		// YOUTUBE LINK
		if (
			query.includes('youtube.com') ||
			query.includes('youtu.be')
		) {

			const search =
				await yts(query);

			video = search.videos[0];

		} else {

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
		}

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

		// ================= GET AUDIO LINK =================

		const audioUrl =
			await getDownload(video.url);

		if (!audioUrl) {

			throw new Error(
				'No audio URL found'
			);
		}

		// ================= DOWNLOAD AUDIO =================

		const audioResponse =
			await axios({
				method: 'GET',
				url: audioUrl,
				responseType: 'stream',
				timeout: 120000,
				headers: {
					'User-Agent':
						'Mozilla/5.0',
					'Accept':
						'*/*'
				}
			});

		const chunks = [];

		await new Promise((resolve, reject) => {

			audioResponse.data.on(
				'data',
				chunk => chunks.push(chunk)
			);

			audioResponse.data.on(
				'end',
				resolve
			);

			audioResponse.data.on(
				'error',
				reject
			);
		});

		const audioBuffer =
			Buffer.concat(chunks);

		if (
			!audioBuffer ||
			audioBuffer.length < 10000
		) {

			throw new Error(
				'Invalid audio buffer'
			);
		}

		// ================= THUMB =================

		const thumb =
			await axios.get(
				video.thumbnail,
				{
					responseType:
						'arraybuffer'
				}
			);

		const thumbBuffer =
			Buffer.from(
				thumb.data
			);

		// ================= SEND AUDIO =================

		await sock.sendMessage(chatId, {

			audio: audioBuffer,

			mimetype:
				'audio/mpeg',

			fileName:
`${video.title}.mp3`,

			ptt: false,

			title:
				video.title,

			performer:
				video.author?.name ||
				'Unknown Artist',

			jpegThumbnail:
				thumbBuffer,

			contextInfo: {
				externalAdReply: {

					showAdAttribution:
						false,

					title:
						video.title,

					body:
`🎤 ${video.author?.name || 'Unknown Artist'}`,

					mediaType: 1,

					renderLargerThumbnail:
						true,

					thumbnailUrl:
						video.thumbnail,

					sourceUrl:
						video.url
				}
			}

		}, {
			quoted: message
		});

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

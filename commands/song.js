const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
	timeout: 60000,
	headers: {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept':
			'application/json, text/plain, */*'
	}
};

// ================= RETRY FUNCTION =================

async function tryRequest(getter, attempts = 3) {

	let lastError;

	for (let attempt = 1; attempt <= attempts; attempt++) {

		try {

			return await getter();

		} catch (err) {

			lastError = err;

			if (attempt < attempts) {

				await new Promise(r =>
					setTimeout(r, 1000 * attempt)
				);
			}
		}
	}

	throw lastError;
}

// ================= API FUNCTIONS =================

async function getEliteProTechDownloadByUrl(youtubeUrl) {

	const apiUrl =
`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;

	const res = await tryRequest(() =>
		axios.get(apiUrl, AXIOS_DEFAULTS)
	);

	if (
		res?.data?.success &&
		res?.data?.downloadURL
	) {

		return {
			download:
				res.data.downloadURL
		};
	}

	throw new Error('EliteProTech failed');
}

async function getYupraDownloadByUrl(youtubeUrl) {

	const apiUrl =
`https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;

	const res = await tryRequest(() =>
		axios.get(apiUrl, AXIOS_DEFAULTS)
	);

	if (
		res?.data?.success &&
		res?.data?.data?.download_url
	) {

		return {
			download:
				res.data.data.download_url
		};
	}

	throw new Error('Yupra failed');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {

	const apiUrl =
`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;

	const res = await tryRequest(() =>
		axios.get(apiUrl, AXIOS_DEFAULTS)
	);

	if (res?.data?.dl) {

		return {
			download:
				res.data.dl
		};
	}

	throw new Error('Okatsu failed');
}

// ================= MAIN COMMAND =================

async function songCommand(sock, chatId, message, args = []) {

	try {

		// ================= START REACTION =================

		await sock.sendMessage(chatId, {
			react: {
				text: '🎧',
				key: message.key
			}
		});

		// ================= GET QUERY =================

		let text = '';

		if (
			Array.isArray(args) &&
			args.length > 0
		) {

			text = args.join(' ').trim();

		} else {

			text =
				message.message?.conversation ||
				message.message?.extendedTextMessage?.text ||
				'';

			text = text
				.replace(/^\.song\s*/i, '')
				.trim();
		}

		// ================= EMPTY QUERY =================

		if (!text) {

			await sock.sendMessage(chatId, {
				react: {
					text: '⚠️',
					key: message.key
				}
			});

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

		let video;

		// ================= SEARCH =================

		if (
			text.includes('youtube.com') ||
			text.includes('youtu.be')
		) {

			video = {
				url: text,
				title: 'YouTube Audio',
				thumbnail:
'https://i.imgur.com/7vQZ6oA.jpeg',
				timestamp: 'Unknown',
				author: {
					name: 'Unknown Artist'
				}
			};

		} else {

			await sock.sendMessage(chatId, {
				react: {
					text: '🔍',
					key: message.key
				}
			});

			const search =
				await yts(text);

			if (
				!search ||
				!search.videos.length
			) {

				await sock.sendMessage(chatId, {
					react: {
						text: '❌',
						key: message.key
					}
				});

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

		// ================= DOWNLOAD REACTION =================

		await sock.sendMessage(chatId, {
			react: {
				text: '📥',
				key: message.key
			}
		});

		// ================= API FALLBACK =================

		let audioBuffer;
		let downloadSuccess = false;

		const apiMethods = [

			{
				name: 'EliteProTech',
				method: () =>
					getEliteProTechDownloadByUrl(
						video.url
					)
			},

			{
				name: 'Yupra',
				method: () =>
					getYupraDownloadByUrl(
						video.url
					)
			},

			{
				name: 'Okatsu',
				method: () =>
					getOkatsuDownloadByUrl(
						video.url
					)
			}
		];

		for (const apiMethod of apiMethods) {

			try {

				const audioData =
					await apiMethod.method();

				const audioUrl =
					audioData.download;

				if (!audioUrl) continue;

				const audioResponse =
					await axios.get(audioUrl, {

						responseType:
							'arraybuffer',

						timeout: 90000,

						headers: {
							'User-Agent':
								'Mozilla/5.0'
						}
					});

				audioBuffer =
					Buffer.from(
						audioResponse.data
					);

				if (
					audioBuffer &&
					audioBuffer.length > 0
				) {

					downloadSuccess = true;
					break;
				}

			} catch (err) {

				console.log(
`${apiMethod.name} failed:`,
					err.message
				);

				continue;
			}
		}

		// ================= FAILED =================

		if (
			!downloadSuccess ||
			!audioBuffer
		) {

			throw new Error(
				'All download sources failed'
			);
		}

		// ================= THUMBNAIL =================

		const thumbResponse =
			await axios.get(
				video.thumbnail,
				{
					responseType:
						'arraybuffer'
				}
			);

		const thumbBuffer =
			Buffer.from(
				thumbResponse.data
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

		console.error(
			'Song command error:',
			err
		);

		// ================= ERROR REACTION =================

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
┃ ✦ Failed to download song
┃ ✦ Please try again later
┃
╰━━━━━━━━━━━━━━━━━━╯`
		}, {
			quoted: message
		});
	}
}

module.exports = songCommand;

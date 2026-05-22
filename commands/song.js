const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { toAudio } = require('../lib/converter');

const AXIOS_DEFAULTS = {
	timeout: 60000,
	headers: {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'application/json, text/plain, */*'
	}
};

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

	if (res?.data?.success && res?.data?.downloadURL) {

		return {
			download: res.data.downloadURL,
			title: res.data.title
		};
	}

	throw new Error(
		'EliteProTech ytdown returned no download'
	);
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
			download: res.data.data.download_url,
			title: res.data.data.title,
			thumbnail: res.data.data.thumbnail
		};
	}

	throw new Error('Yupra returned no download');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {

	const apiUrl =
`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;

	const res = await tryRequest(() =>
		axios.get(apiUrl, AXIOS_DEFAULTS)
	);

	if (res?.data?.dl) {

		return {
			download: res.data.dl,
			title: res.data.title,
			thumbnail: res.data.thumb
		};
	}

	throw new Error(
		'Okatsu ytmp3 returned no download'
	);
}

// ================= MAIN COMMAND =================

async function songCommand(
	sock,
	chatId,
	message,
	args = []
) {

	try {

		// START REACTION
		await sock.sendMessage(chatId, {
			react: {
				text: '🎵',
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
				text:
`╭━━━〔 🎵 Song Downloader 〕━━━╮
┃ ✦ Please provide
┃ ✦ a song name or link
┃
┃ 📌 Example:
┃ ✦ .song faded
┃ ✦ .song believer
┃ ✦ .song https://youtu.be/xxxx
╰━━━━━━━━━━━━━━━━━━╯`
			}, {
				quoted: message
			});

			return;
		}

		let video;

		// ================= YOUTUBE URL =================

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
				seconds: 180,
				author: {
					name: 'Unknown Artist'
				}
			};

		} else {

			// SEARCH REACTION
			await sock.sendMessage(chatId, {
				react: {
					text: '🔍',
					key: message.key
				}
			});

			const search = await yts(text);

			if (
				!search ||
				!search.videos.length
			) {

				await sock.sendMessage(chatId, {
					text:
`╭━━━〔 ❌ Song Not Found 〕━━━╮
┃ ✦ No matching songs found
┃ ✦ Try another song name
╰━━━━━━━━━━━━━━━━━━╯`
				}, {
					quoted: message
				});

				return;
			}

			video = search.videos[0];
		}

		// ================= REAL DETAILS MESSAGE =================

		await sock.sendMessage(chatId, {

			image: {
				url: video.thumbnail
			},

			caption:
`╭━━━〔 🎵 Audio Details 〕━━━╮
┃ ✦ 🎧 Title:
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
┃ ✦ 🔍 Status:
┃ ✦ Downloading Audio...
╰━━━━━━━━━━━━━━━━━━╯`

		}, {
			quoted: message
		});

		// DOWNLOAD REACTION
		await sock.sendMessage(chatId, {
			react: {
				text: '⬇️',
				key: message.key
			}
		});

		// ================= API FALLBACK =================

		let audioData;
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

				audioData =
					await apiMethod.method();

				const audioUrl =
					audioData.download ||
					audioData.dl ||
					audioData.url;

				if (!audioUrl) continue;

				const audioResponse =
					await axios.get(audioUrl, {

						responseType:
							'arraybuffer',

						timeout: 90000,

						maxContentLength:
							Infinity,

						maxBodyLength:
							Infinity,

						decompress: true,

						validateStatus:
							s => s >= 200 &&
							s < 400,

						headers: {
							'User-Agent':
								'Mozilla/5.0',

							'Accept': '*/*',

							'Accept-Encoding':
								'identity'
						}
					});

				audioBuffer = Buffer.from(
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
				'All download sources failed.'
			);
		}

		// ================= FORMAT DETECTION =================

		const firstBytes =
			audioBuffer.slice(0, 12);

		const asciiSignature =
			firstBytes.toString(
				'ascii',
				4,
				8
			);

		let fileExtension = 'mp3';

		if (asciiSignature === 'ftyp') {

			fileExtension = 'm4a';
		}

		// ================= CONVERT =================

		let finalBuffer = audioBuffer;

		if (fileExtension !== 'mp3') {

			finalBuffer = await toAudio(
				audioBuffer,
				fileExtension
			);

			if (
				!finalBuffer ||
				finalBuffer.length === 0
			) {

				throw new Error(
					'Audio conversion failed'
				);
			}
		}

		// ================= CUSTOM METADATA =================

		const customTitle =
			'♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ';

		const customArtist =
			'𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

		const customAlbum =
			'𝐋ɪɴᴜх 𝐒ᴇʀ 🧃🕊️';

		// CUSTOM COVER PIC PATH
		const customThumbnail =
'https://i.imgur.com/7vQZ6oA.jpeg';

		// ================= SEND AUDIO =================

		await sock.sendMessage(chatId, {

			audio: finalBuffer,

			mimetype: 'audio/mpeg',

			ptt: false,

			fileName:
'♪ 𝐕ɪʙᴇ 𝐁ʏ 𝐋ꜱ.mp3',

			contextInfo: {
				externalAdReply: {

					showAdAttribution:
						false,

					title:
						customTitle,

					body:
`🎤 ${customArtist}`,

					mediaType: 1,

					renderLargerThumbnail:
						true,

					thumbnailUrl:
						customThumbnail,

					sourceUrl:
						video.url
				}
			},

			// AUDIO METADATA
			title:
				customTitle,

			seconds:
				video.seconds || 180,

			waveform: [
				100, 0, 100, 0,
				100, 0, 100, 0
			],

			jpegThumbnail:
				Buffer.from(
					await (
						await axios.get(
							customThumbnail,
							{
								responseType:
									'arraybuffer'
							}
						)
					).data
				)

		}, {
			quoted: message
		});

		// SUCCESS REACTION
		await sock.sendMessage(chatId, {
			react: {
				text: '✅',
				key: message.key
			}
		});

		// ================= CLEANUP =================

		try {

			const tempDir =
				path.join(
					__dirname,
					'../temp'
				);

			if (
				fs.existsSync(tempDir)
			) {

				const files =
					fs.readdirSync(
						tempDir
					);

				const now =
					Date.now();

				files.forEach(file => {

					const filePath =
						path.join(
							tempDir,
							file
						);

					try {

						const stats =
							fs.statSync(
								filePath
							);

						if (
							now -
							stats.mtimeMs >
							10000
						) {

							if (
								file.endsWith(
									'.mp3'
								) ||

								file.endsWith(
									'.m4a'
								)
							) {

								fs.unlinkSync(
									filePath
								);
							}
						}

					} catch {}
				});
			}

		} catch {}

	} catch (err) {

		console.error(
			'Song command error:',
			err
		);

		// ERROR REACTION
		await sock.sendMessage(chatId, {
			react: {
				text: '❌',
				key: message.key
			}
		});

		let errorMessage =
`╭━━━〔 ❌ Download Failed 〕━━━╮
┃ ✦ Failed to download song
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`;

		if (
			err.message &&
			err.message.includes(
				'blocked'
			)
		) {

			errorMessage =
`╭━━━〔 🚫 Region Blocked 〕━━━╮
┃ ✦ This audio is unavailable
┃ ✦ In your current region
╰━━━━━━━━━━━━━━━━━━╯`;

		} else if (
			err.message &&
			err.message.includes(
				'All download sources failed'
			)
		) {

			errorMessage =
`╭━━━〔 ❌ Server Failed 〕━━━╮
┃ ✦ All download servers failed
┃ ✦ Please try again later
╰━━━━━━━━━━━━━━━━━━╯`;
		}

		await sock.sendMessage(chatId, {
			text: errorMessage
		}, {
			quoted: message
		});
	}
}

module.exports = songCommand;

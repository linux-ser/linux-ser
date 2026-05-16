const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function loadState() {
	try {
		const raw = fs.readFileSync(
			path.join(__dirname, '..', 'data', 'mention.json'),
			'utf8'
		);

		const state = JSON.parse(raw);

		if (
			state &&
			typeof state.assetPath === 'string' &&
			state.assetPath.endsWith('assets/mention_default.webp')
		) {
			return {
				enabled: !!state.enabled,
				assetPath: '',
				type: 'text'
			};
		}

		return state;

	} catch {
		return {
			enabled: false,
			assetPath: '',
			type: 'text'
		};
	}
}

function saveState(state) {
	fs.writeFileSync(
		path.join(__dirname, '..', 'data', 'mention.json'),
		JSON.stringify(state, null, 2)
	);
}

async function ensureDefaultSticker(state) {
	try {
		const assetPath = path.join(__dirname, '..', state.assetPath);

		if (
			state.assetPath &&
			state.assetPath.endsWith('mention_default.webp') &&
			!fs.existsSync(assetPath)
		) {

			const defaultStickerPath = path.join(
				__dirname,
				'..',
				'assets',
				'stickintro.webp'
			);

			if (fs.existsSync(defaultStickerPath)) {

				fs.copyFileSync(defaultStickerPath, assetPath);

			} else {

				const assetsDir = path.dirname(assetPath);

				if (!fs.existsSync(assetsDir)) {
					fs.mkdirSync(assetsDir, { recursive: true });
				}

				fs.writeFileSync(
					assetPath.replace('.webp', '.txt'),
					'Default mention sticker not available'
				);
			}
		}

	} catch (e) {
		console.warn('ensureDefaultSticker failed:', e?.message || e);
	}
}

async function handleMentionDetection(sock, chatId, message) {
	try {

		if (message.key?.fromMe) return;

		const state = loadState();

		await ensureDefaultSticker(state);

		if (!state.enabled) return;

		const rawId = sock.user?.id || sock.user?.jid || '';

		if (!rawId) return;

		const botNum = rawId.split('@')[0].split(':')[0];

		const botJids = [
			`${botNum}@s.whatsapp.net`,
			`${botNum}@whatsapp.net`,
			rawId
		];

		const msg = message.message || {};

		const contexts = [
			msg.extendedTextMessage?.contextInfo,
			msg.imageMessage?.contextInfo,
			msg.videoMessage?.contextInfo,
			msg.documentMessage?.contextInfo,
			msg.stickerMessage?.contextInfo,
			msg.buttonsResponseMessage?.contextInfo,
			msg.listResponseMessage?.contextInfo
		].filter(Boolean);

		let mentioned = [];

		for (const c of contexts) {
			if (Array.isArray(c.mentionedJid)) {
				mentioned = mentioned.concat(c.mentionedJid);
			}
		}

		const directMentionLists = [
			msg.extendedTextMessage?.mentionedJid,
			msg.mentionedJid
		].filter(Array.isArray);

		for (const arr of directMentionLists) {
			mentioned = mentioned.concat(arr);
		}

		if (!mentioned.length) {

			const rawText = (
				msg.conversation ||
				msg.extendedTextMessage?.text ||
				msg.imageMessage?.caption ||
				msg.videoMessage?.caption ||
				''
			).toString();

			if (rawText) {

				const safeBot = botNum.replace(/[-\s]/g, '');

				const re = new RegExp(`@?${safeBot}\\b`);

				if (!re.test(rawText.replace(/\s+/g, ''))) return;

			} else {
				return;
			}
		}

		const isBotMentioned = mentioned.some(j =>
			botJids.includes(j)
		);

		if (!isBotMentioned) {
			// fallback mention detected
		}

		if (!state.assetPath) {

			await sock.sendMessage(chatId, {
				text: '👋 Hi'
			}, { quoted: message });

			return;
		}

		const assetPath = path.join(
			__dirname,
			'..',
			state.assetPath
		);

		if (!fs.existsSync(assetPath)) {

			await sock.sendMessage(chatId, {
				text: '👋 Hi'
			}, { quoted: message });

			return;
		}

		try {

			if (state.type === 'sticker') {

				await sock.sendMessage(chatId, {
					sticker: fs.readFileSync(assetPath)
				}, { quoted: message });

				return;
			}

			const payload = {};

			if (state.type === 'image') {

				payload.image = fs.readFileSync(assetPath);

			} else if (state.type === 'video') {

				payload.video = fs.readFileSync(assetPath);

				if (state.gifPlayback) {
					payload.gifPlayback = true;
				}

			} else if (state.type === 'audio') {

				payload.audio = fs.readFileSync(assetPath);

				payload.mimetype =
					state.mimetype || 'audio/mpeg';

				if (typeof state.ptt === 'boolean') {
					payload.ptt = state.ptt;
				}

			} else if (state.type === 'text') {

				payload.text = fs.readFileSync(assetPath, 'utf8');

			} else {

				payload.text = '👋 Hi';
			}

			await sock.sendMessage(chatId, payload, {
				quoted: message
			});

		} catch (e) {

			await sock.sendMessage(chatId, {
				text: '👋 Hi'
			}, { quoted: message });
		}

	} catch (err) {
		console.error('handleMentionDetection error:', err);
	}
}

async function mentionToggleCommand(
	sock,
	chatId,
	message,
	args,
	isOwner
) {

	if (!isOwner) {
		return sock.sendMessage(chatId, {
			text: '❌ Only Owner or Sudo can use this command.'
		}, { quoted: message });
	}

	const onoff = (args || '').trim().toLowerCase();

	// USAGE MESSAGE
	if (!onoff) {

		return sock.sendMessage(chatId, {
			text:
`📌 *Mention Command Usage*

🟢 Enable Mention Reply
.mention on

🔴 Disable Mention Reply
.mention off

🛠 Set Mention Reply
Reply to image/video/audio/text/sticker

Then send:
.setmention`
		}, { quoted: message });
	}

	if (!['on', 'off'].includes(onoff)) {

		return sock.sendMessage(chatId, {
			text:
`❌ Invalid option

Use:
.mention on
or
.mention off`
		}, { quoted: message });
	}

	const state = loadState();

	state.enabled = onoff === 'on';

	saveState(state);

	await sock.sendMessage(chatId, {
		react: {
			text: state.enabled ? '✅' : '❌',
			key: message.key
		}
	});

	return sock.sendMessage(chatId, {
		text:
`📌 Mention Reply ${state.enabled ? 'Enabled' : 'Disabled'}`
	}, { quoted: message });
}

async function setMentionCommand(
	sock,
	chatId,
	message,
	isOwner
) {

	if (!isOwner) {
		return sock.sendMessage(chatId, {
			text: '❌ Only Owner or Sudo can use this command.'
		}, { quoted: message });
	}

	await sock.sendMessage(chatId, {
		react: {
			text: '📌',
			key: message.key
		}
	});

	const ctx =
		message.message?.extendedTextMessage?.contextInfo;

	const qMsg = ctx?.quotedMessage;

	if (!qMsg) {

		return sock.sendMessage(chatId, {
			text:
`📌 *Mention Reply Setup*

Reply to:
🖼 Image
🎥 Video
🎵 Audio
💬 Text
🎭 Sticker

Then type:
.setmention`
		}, { quoted: message });
	}

	let type = 'sticker';
	let buf;
	let dataType;

	if (qMsg.stickerMessage) {

		dataType = 'stickerMessage';
		type = 'sticker';

	} else if (qMsg.imageMessage) {

		dataType = 'imageMessage';
		type = 'image';

	} else if (qMsg.videoMessage) {

		dataType = 'videoMessage';
		type = 'video';

	} else if (qMsg.audioMessage) {

		dataType = 'audioMessage';
		type = 'audio';

	} else if (
		qMsg.conversation ||
		qMsg.extendedTextMessage?.text
	) {

		type = 'text';

	} else {

		return sock.sendMessage(chatId, {
			text:
'❌ Unsupported.\nReply to image/video/audio/sticker/text only.'
		}, { quoted: message });
	}

	if (type === 'text') {

		buf = Buffer.from(
			qMsg.conversation ||
			qMsg.extendedTextMessage?.text ||
			'',
			'utf8'
		);

		if (!buf.length) {

			return sock.sendMessage(chatId, {
				text: '❌ Empty text.'
			}, { quoted: message });
		}

	} else {

		try {

			const media = qMsg[dataType];

			const kind =
				type === 'sticker'
					? 'sticker'
					: type;

			const stream =
				await downloadContentFromMessage(
					media,
					kind
				);

			const chunks = [];

			for await (const chunk of stream) {
				chunks.push(chunk);
			}

			buf = Buffer.concat(chunks);

		} catch (e) {

			console.error('download error', e);

			return sock.sendMessage(chatId, {
				text: '❌ Failed to download media.'
			}, { quoted: message });
		}
	}

	if (buf.length > 1024 * 1024) {

		return sock.sendMessage(chatId, {
			text: '❌ File too large.\nMax: 1 MB'
		}, { quoted: message });
	}

	let mimetype = qMsg[dataType]?.mimetype || '';

	let ptt = !!qMsg.audioMessage?.ptt;

	let gifPlayback =
		!!qMsg.videoMessage?.gifPlayback;

	let ext = 'bin';

	if (type === 'sticker') ext = 'webp';

	else if (type === 'image')
		ext = mimetype.includes('png')
			? 'png'
			: 'jpg';

	else if (type === 'video')
		ext = 'mp4';

	else if (type === 'audio') {

		if (
			mimetype.includes('ogg') ||
			mimetype.includes('opus')
		) {
			ext = 'ogg';
			mimetype = 'audio/ogg; codecs=opus';
		}

		else if (
			mimetype.includes('mpeg') ||
			mimetype.includes('mp3')
		) {
			ext = 'mp3';
			mimetype = 'audio/mpeg';
		}

		else {
			ext = 'mp3';
			mimetype = 'audio/mpeg';
		}

	} else if (type === 'text') {
		ext = 'txt';
	}

	try {

		const assetsDir = path.join(
			__dirname,
			'..',
			'assets'
		);

		if (fs.existsSync(assetsDir)) {

			const files = fs.readdirSync(assetsDir);

			for (const f of files) {

				if (f.startsWith('mention_custom.')) {

					try {
						fs.unlinkSync(
							path.join(assetsDir, f)
						);
					} catch {}
				}
			}
		}

	} catch (e) {
		console.warn(
			'cleanup failed:',
			e?.message || e
		);
	}

	const outName = `mention_custom.${ext}`;

	const outPath = path.join(
		__dirname,
		'..',
		'assets',
		outName
	);

	try {

		fs.writeFileSync(outPath, buf);

	} catch (e) {

		console.error('write error', e);

		return sock.sendMessage(chatId, {
			text: '❌ Failed to save file.'
		}, { quoted: message });
	}

	const state = loadState();

	state.assetPath = path.join(
		'assets',
		outName
	);

	state.type = type;

	if (type === 'audio') {
		state.mimetype = mimetype;
		state.ptt = ptt;
	}

	if (type === 'video') {
		state.gifPlayback = gifPlayback;
	}

	saveState(state);

	return sock.sendMessage(chatId, {
		text:
`✅ Mention reply updated successfully!

📂 Type: ${type}
📌 Status: Active`
	}, { quoted: message });
}

module.exports = {
	handleMentionDetection,
	mentionToggleCommand,
	setMentionCommand
};

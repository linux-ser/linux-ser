// ================= SEND AUDIO =================

await sock.sendMessage(chatId, {

	audio: finalBuffer,

	mimetype: 'audio/mpeg',

	// ORIGINAL FILE NAME
	fileName:
`${video.title}.mp3`,

	ptt: false,

	// ORIGINAL TITLE
	title:
		video.title,

	// ORIGINAL ARTIST
	performer:
		video.author?.name || 'Unknown Artist',

	// ORIGINAL THUMBNAIL
	jpegThumbnail:
		Buffer.from(
			await (
				await axios.get(
					video.thumbnail,
					{
						responseType:
							'arraybuffer'
					}
				)
			).data
		),

	// ORIGINAL MUSIC CARD
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

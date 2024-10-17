const express = require('express');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const URL = require("url").URL;
const { Octokit } = require("@octokit/core");
const { createLogger, format, transports } = require("winston");

const logLevels = {
	fatal: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
	trace: 5,
};

const logger = createLogger({
	levels: logLevels,
	transports: [new transports.Console()],
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', async function (req, res) {

	// Check for needed secrets
	const stringIsAValidUrl = (s) => {
		try {
			new URL(s);
			return true;
		} catch (err) {
			return false;
		}
	};

	const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN;
	const telegram_chat_id = process.env.TELEGRAM_CHAT_ID;
	if (!telegram_bot_token || !telegram_chat_id) {
		return res.json({ success: false, error: 'Telegram bot token or chat ID is missing.' });
	}

	const kofi_token = process.env.KOFI_TOKEN;
	if (!kofi_token) return res.json({ success: false, error: 'Ko-fi token required.' });

	const kofi_username = process.env.KOFI_USERNAME;

	const gist_url = process.env.GIST_URL;
	const gist_token = process.env.GIST_TOKEN;

	const octokit = new Octokit({
		auth: gist_token
	});

	// Check if payload data is valid
	const data = req.body.data;
	if (!data) return res.json(`Hello world.`);
	const payload = JSON.parse(data);

	// Check if kofi token is valid
	if (payload.verification_token !== kofi_token) {
		return res.json({ success: false, error: 'Ko-fi token does not match.' });
	}

	// Strip sensitive info from payload
	try {
		const censor = '*****';
		payload['verification_token'] = censor;
		payload['email'] = censor;
		payload['kofi_transaction_id'] = censor;
		payload['shipping'] = null;
	} catch {
		return res.json({ success: false, error: 'Payload data invalid.' });
	}

	// Prepare the message for Telegram
	try {
		let message = `☕ *Nueva donación en Ko-fi*\n\n`;
		message += `*De*: ${payload.from_name}\n`;
		message += `*Tipo*: ${payload.type}\n`;
		message += `*Cantidad*: ${payload.amount} ${payload.currency}\n`;

		if (payload.message && payload.message !== 'null') {
			message += `*Mensaje*: ${payload.message}\n`;
		}

		message += `\n¡Gracias por apoyarme! ❤️`;

		// Send message to Telegram
		const telegramUrl = `https://api.telegram.org/bot${telegram_bot_token}/sendMessage`;

		request.post({
			url: telegramUrl,
			json: {
				chat_id: telegram_chat_id,
				text: message,
				parse_mode: 'Markdown'
			}
		}, (error, response, body) => {
			if (error) {
				logger.error(error);
				return res.json({ success: false, error });
			}
			if (response.statusCode !== 200) {
				logger.error(`Telegram API returned error: ${response.statusCode}`);
				return res.json({ success: false, error: `Telegram API error: ${response.statusCode}` });
			}
		});
	} catch (err) {
		logger.error(err);
		return res.json({ success: false, error: err });
	}

	logger.info(`Processed payload ${payload.message_id}.`);

	// Return early if gist stuff not provided
	if (!gist_url || !gist_token) {
		logger.info(`Skipping gist update.`);
		return res.json({ success: true });
	}

	// Request for gist content
	request(gist_url, { json: true }, async (error, resp, body) => {
		if (error) {
			logger.error(`Problem retrieving gist content: \n${error}`);
			return res.json({ success: false, error: error });
		};

		if (resp.statusCode == 404) {
			logger.error(`Problem retrieving gist: Not found.`);
			return res.json({ success: false, error: 'Gist not found.' });
		}

		let supporters = body || [];

		if (!error && resp.statusCode == 200) {
			try {
				supporters.push(payload);
			} catch (error) {
				logger.error(`Problem retrieving gist: ${error}.`);
				return res.json({ success: false, error: error });
			}
		};

		return await updateGist(supporters);
	});

	async function updateGist(supporters) {
		const url = gist_url;
		const regex = /\/([\da-f]+)\/raw\//;

		const match = url.match(regex);

		if (match) {
			const gistId = match[1];
			const timestamp = Date.now();
			const dateObj = new Date(timestamp);
			const dateString = dateObj.toLocaleString();
			let gist_res = await octokit.request(`PATCH /gists/${gistId}`, {
				gist_id: gistId,
				description: `Last updated at ${dateString}`,
				files: {
					'kofi.json': {
						content: JSON.stringify(supporters)
					}
				},
				headers: {
					'X-GitHub-Api-Version': '2022-11-28'
				}
			});
			if (gist_res.status == 200) {
				logger.info(`Updated gist for payload ${payload.message_id}.`);
				return res.json({ success: true });
			} else {
				logger.error(`Failed to update gist: ${res.status}`);
				return res.json({ success: false, error: `Update gist failed: ${res.status}` });
			}
		} else {
			logger.error('Could not find your Gist ID from your Gist URL.');
			return res.json({ success: false, error: 'Could not get Gist ID from URL.' });
		}
	}
});

module.exports.handler = serverless(app);

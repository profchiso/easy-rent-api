const mailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const SENDGRID_USERNAME = process.env.SENDGRID_USERNAME;
const SENDGRID_PASSWORD = process.env.SENDGRID_PASSWORD;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

exports.sendEmailWithNodeMailer = async (options) => {
	try {
		const transporter = mailer.createTransport(
			sendgridTransport({
				auth: {
					api_user: process.env.SENDGRID_API_USER, // SG username
					api_key: process.env.SENDGRID_API_PASSWORD, // SG password
				},
			})
		);
		const mailOptions = {
			from: options.from,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html,
			// attachments: options.attachments,
		};
		transporter.sendMail(mailOptions, (err, resp) => {
			if (err) {
				console.log(err);
			} else {
				console.log('mail sent-> response', resp);
			}
		});
	} catch (error) {
		console.log(error);
	}
};

exports.sendEmailWithSendgrid = async (options) => {
	sgMail.setApiKey(SENDGRID_API_KEY);
	try {
		const mailOptions = {
			from: options.from,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html,
		};

		await sgMail.send(mailOptions);
	} catch (error) {
		console.log(error);
	}
};

exports.sendEmailWithMailgun = async (options) => {
	try {
		const API_KEY = process.env.MAILGUN;
		const DOMAIN = process.env.MAILGUN_DOMAIN;
		var mailgun = require('mailgun-js')({ apiKey: API_KEY, domain: DOMAIN });

		const mailOptions = {
			from: options.from,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html,
		};

		await mailgun.messages().send(mailOptions, (error, body) => {
			if (error) {
				console.log('mail error', error);
			}
			console.log('mail body', body);
		});
	} catch (error) {
		console.log('error from email sending', error);
	}
};

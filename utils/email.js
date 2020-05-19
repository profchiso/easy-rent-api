const mailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const SENDGRID_USERNAME = process.env.SENDGRID_USERNAME;
const SENDGRID_PASSWORD = process.env.SENDGRID_PASSWORD;

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
				console.log('mail sent');
			}
		});
	} catch (error) {
		console.log(error);
	}
};

exports.sendEmailWithSendgrid = async () => {
	try {
		const transporter = mailer.createTransport({
			service: 'SendGrid',
			auth: {
				user: SENDGRID_USERNAME,
				pass: SENDGRID_PASSWORD,
			},
		});

		//define the options
		const mailOptions = {
			from: 'giftedbraintech <giftedbraintech@gamil.com>',
			to: options.email,
			subject: options.subject,
			text: options.message,
			//html:"to be handled later"
		};
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.log(error);
	}
};

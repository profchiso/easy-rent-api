const mailer = require('nodemailer');
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;

exports.sendEmailWithNodeMailer = async (options) => {
	//be sure to activate the "less secure app" option in your gmail account if you are using gmail  as the transport service
	try {
		const transporter = mailer.createTransport({
			host: EMAIL_HOST,
			port: EMAIL_PORT,
			auth: {
				user: EMAIL,
				pass: PASSWORD
			}
		});

		//define the options
		const mailOptions = {
			from: 'giftedbraintech <giftedbraintech@gamil.com>',
			to: options.email,
			subject: options.subject,
			text: options.message
			//html:"to be handled later"
		};
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.log(error);
	}
};

exports.sendEmailWithSendgrid = async () => {};

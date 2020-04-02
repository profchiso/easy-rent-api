const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
	try {
		const bearerHeader = req.headers['authorization'];

		if (typeof bearerHeader !== 'undefined') {
			const bearer = bearerHeader.split(' ');
			const bearerToken = bearer[1];

			const decodeToken = jwt.verify(bearerToken, JWT_SECRET);
			req.user = decodeToken.user;
			next();
		} else {
			return res.status(401).json({
				status: 'Failed',
				message: 'Unauthorized request, No access token'
			});
		}
	} catch (error) {
		console.log(error);
		res.status(401).json({
			status: 'Failed',
			error,
			message: 'Invalid token'
		});
	}
};

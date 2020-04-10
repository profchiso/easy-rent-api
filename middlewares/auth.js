const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticate = async (req, res, next) => {
	try {
		//formal implementation
		// const bearerHeader = req.headers['authorization'];

		// if (typeof bearerHeader !== 'undefined') {
		// 	const bearer = bearerHeader.split(' ');
		// 	const bearerToken = bearer[1];

		// 	const decodeToken = jwt.verify(bearerToken, JWT_SECRET);
		// 	req.user = decodeToken.user;
		// 	next();
		// } else {
		// 	return res.status(401).json({
		// 		status: 'Failed',
		// 		message: 'Unauthorized request, No access token'
		// 	});
		// }

		//more robust implementation
		let token;

		//check if token was sent along with the request and also that the user used the right authorization header
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith('Bearer')
		) {
			token = req.headers.authorization.split(' ')[1];
		}

		//check if the access token actually exist
		if (!token) {
			return res.status(401).json({
				status: 'Failed',
				message: 'Acesss denied, No authorization token'
			});
		}
		//decode the acesss token
		const decodedToken = await jwt.verify(token, JWT_SECRET);

		//check if user exist   just to be sure the user had not bern deleted
		const user = await User.findById(decodedToken.user.id);
		if (!user) {
			return res.status(401).json({
				status: 'Failed',
				message:
					'Acesss denied, User with the token might have been deleted or deactivated'
			});
		}

		//check if user changed password after the token was issued
		if (!user.checkIfUserChangedPasswordAfterJWTToken(decodedToken.iat)) {
			return res.status(401).json({
				status: 'Failed',
				message:
					'You recently changed you password,Please re-login and  try again'
			});
		}

		//Allow access to protected route
		req.user = user;
		// console.log(req.user);
		next();
	} catch (error) {
		console.log(error);
		res.status(401).json({
			status: 'Failed',
			error,
			message: 'Invalid token'
		});
	}
};

exports.authorize = (...roles) => {
	return (req, res, nex) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				status: 'Failed',
				message: 'Sorry you are not allowed to carry out this operation'
			});
		}
		//user is authorized
		next();
	};
};

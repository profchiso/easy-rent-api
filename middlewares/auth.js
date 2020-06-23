const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticate = async (req, res, next) => {
	const apiError = {};
	try {
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
			apiError.errMessage = `Acesss denied, No authorization token`;
			apiError.statusCode = 401;
			apiError.status = 'Failed';
			return res.json(apiError);
		}
		//decode the acesss token
		const decodedToken = await jwt.verify(token, JWT_SECRET);

		//check if user exist   just to be sure the user had not bern deleted
		const user = await User.findById(decodedToken.user.id);
		if (!user) {
			apiError.errMessage = `Acesss denied, User with the token might have been deleted or deactivated`;
			apiError.statusCode = 401;
			apiError.status = 'Failed';
			return res.json(apiError);
		}

		//check if user changed password after the token was issued
		if (!user.checkIfUserChangedPasswordAfterJWTToken(decodedToken.iat)) {
			apiError.errMessage = `You recently changed you password,Please re-login and  try again`;
			apiError.statusCode = 401;
			apiError.status = 'Failed';
			return res.json(apiError);
		}

		//Allow access to protected route
		req.user = user;

		next();
	} catch (error) {
		console.log(error);

		apiError.errMessage = `Invalid token`;
		apiError.statusCode = 401;
		apiError.status = 'Failed';
		return res.json(apiError);
	}
};

exports.authorize = (...roles) => {
	const apiError = {};
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			apiError.errMessage = `Sorry you are not allowed to carry out this operation`;
			apiError.statusCode = 403;
			apiError.status = 'Failed';
			return res.json(apiError);
		}
		//user is authorized
		next();
	};
};

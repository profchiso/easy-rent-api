const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const User = require('../../models/Users');
const { sendEmail } = require('../../utils/email');
const {
	authanticate,
	authorize,
	forgotPassword,
	resetPassword
} = require('../../middlewares/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// get all users , restricted to admins and developers users
router.get(
	'/',
	authanticate,
	authorize('admin', 'developer'),
	async (req, res) => {
		//this route can take parameters pass it by ?param=value

		try {
			// console.log(req.query);
			let requestQueryObject = { ...req.query }; //make a copy of the req.query object

			let excludedQueryField = ['sort', 'page', 'pageSize', 'fields']; //define keywords in the req.query that should not be considered while querying the database

			excludedQueryField.forEach(
				(element) => delete requestQueryObject[element]
			); //delete any key in the requestQueryObject containing an allement in the  excludedQueryField  array

			//advance query using gte,lte,gt,lt
			let queryToString = JSON.stringify(requestQueryObject);
			queryToString = queryToString.replace(
				/\b(gte|lte|gt|lt)\b/g,
				(match) => `$${match}`
			);

			let query = User.find(JSON.parse(queryToString)); // the .select excludes any spacified field before sending the document

			//sorting query result
			if (req.query.sort) {
				// to sort pass the sort param ie ?sort="field1,field2,..." //ascending
				// to sort pass the sort param ie ?sort="-field1,-field2,..." //descending
				const sortBy = req.query.sort.split(',').join(' ');
				query = query.sort(sortBy);
			} else {
				query = query.sort('-createdAt');
			}

			//field limiting
			//pass a parameter called field eg. ?fields=field1,field2,...
			if (req.query.fields) {
				const fields = req.query.fields.split(',').join(' ');

				query = query.select(fields);
			} else {
				query = query.select('-__v -password');
			}

			//pagination
			//pass page and limit params  eg  ?page=1&pageSize=20

			const page = req.query.page * 1 || 1;
			const pageSize = req.query.pageSize * 1 || 50;
			const skip = (page - 1) * pageSize;
			query = query.skip(skip).limit(pageSize);

			//handle a case where user specify page that does not exists
			if (req.query.page) {
				let numberOfDocument = await User.countDocuments();
				if (skip >= numberOfDocument) {
					return res.status(404).json({
						status: 'failed',
						result: 0,
						message: 'This page does not exits'
					});
				}
			}

			//execute query
			const users = await query; // query.sort().select().skip().limit()

			return res.status(200).json({
				status: 'success',
				result: users.length,
				users
			});
		} catch (error) {
			console.log(error);
			return res.status(400).json({
				status: 'Failed',
				error
			});
		}
	}
);

//get single user, , restricted to admins and developers users
router.get(
	'/:id',
	authanticate,
	authorize('admin', 'developer'),
	async (req, res) => {
		try {
			const user = await User.findById(req.params.id).select('-__v');
			return res.status(200).json({
				status: 'success',
				user
			});
		} catch (error) {
			console.log(error);
			return res.status(400).json({
				ststus: 'failed',
				error
			});
		}
	}
);

//register a user
router.post(
	'/signup',
	[
		check('name', 'Name  is requird')
			.not()
			.notEmpty(),
		check('email', 'Email is required')
			.not()
			.notEmpty(),
		check('email', 'Invalid email').isEmail(),
		check('password', 'Password required').notEmpty(),
		check('address', 'Address required ').notEmpty(),
		check('phone', 'Phone number required')
			.not()
			.notEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'Failed', errors: errors.array() });
		}
		try {
			const { email } = req.body;
			const user = await User.findOne({ email });
			if (user) {
				return res.status(400).json({
					status: 'failed',
					message: 'user already exist!'
				});
			}
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			});
			const userData = req.body;
			userData.avatar = avatar;

			//comment because password is now hash  using a pre middleware in the User model
			// const salt = await bcrypt.genSalt(10);
			// userData.password = await bcrypt.hash(password, salt);

			const createUser = await User.create({
				name: userData.name,
				email: userData.email,
				avatar: userData.avatar,
				password: userData.password,
				address: userData.address,
				phone: userData.phone
			});
			console.log(createUser.id);
			const payLoad = {
				user: {
					id: createUser.id
				}
			};
			jwt.sign(payLoad, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
				if (error) throw error;
				return res.status(201).json({
					status: 'success',
					token
				});
			});
		} catch (error) {
			console.log(error);
			return res.status(400).json({
				status: 'failed',
				error
			});
		}
	}
);

// user login route
router.post(
	'/login',
	[
		check('email', 'Email is required')
			.not()
			.notEmpty(),
		check('password', 'Password required').exists()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 'Failed',
				error: errors.array()
			});
		}
		const { email, password } = req.body;
		try {
			const user = await User.findOne({ email }).select('+password');

			if (!user || !(await user.isMatchPassword(password, user.password))) {
				return res.status(401).json({
					status: 'Failed',
					message: 'Invalid user credentials'
				});
			}

			const payLoad = {
				user: {
					id: user.id
				}
			};
			jwt.sign(payLoad, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
				if (error) throw error;
				return res.status(200).json({
					status: 'success',
					token
				});
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ status: 'Failed', error });
		}
	}
);

router.post('/forgot-password', forgotPassword, async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({
				status: 'Failed',
				message: `No email was provided, Please provide a valid email`
			});
		}
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({
				status: 'Failed',
				message: `No user with the provided email ${email}`
			});
		}
		//get the reset token from the instance middleware in the User model
		const resetPasswordToken = user.generatePasswordResetToken();

		//update the user data by setting the passwordResetToken and passwordResetTokenExpires
		await user.save({ validateBeforeSave: false }); // the validate before save optioon disable all the user model validations

		//generate reset password url
		const resetURL = `${req.protocol}://${req.get(
			'host'
		)}/api/v1/users/reset-password/${resetPasswordToken}`;

		const message = `Forgot your password?, reset your password here ${resetURL}. \n please if you did not request for password reset, ignore this message`;

		//send the
		try {
			await sendEmail({
				email: user.email,
				subject: 'Your password reset token last for (5 minutes)',
				message
			});

			//send route response
			return res.status(200).json({
				status: 'success',
				message: `A password reset token has ben sent to your email address  ${user.email} `
			});
		} catch (error) {
			//if the is an error while sending resettoken mail, set both passwordResetToken ,passwordResetTokenExpires to undefined and save
			user.passwordResetToken = undefined;
			user.passwordResetTokenExpires = undefined;
			await user.save({ validateBeforeSave: false });
			return res.status(500).json({
				status: 'Failed',
				message: 'There was an erro sending the email please try again later'
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			message: error
		});
	}
});

router.patch('/reset-password/:token', resetPassword, async (req, res) => {});

//modify user accout
router.patch('/:id', authanticate, async (req, res) => {
	try {
		let updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		}).select('-password');
		return res.status(200).json({
			status: 'success',
			user: updatedUser
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'failed',
			error
		});
	}
});

//delete a user
router.delete('/:id', authanticate, async (req, res) => {
	try {
		await User.findByIdAndRemove(req.params.id).select('-password');
		return res.status(204).json({
			status: 'success',
			message: `User with the id ${req.params.id} has been deleted`
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'failed',
			error
		});
	}
});

module.exports = router;

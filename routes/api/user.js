//discovered that router cannot accept more than 10 endpoints

const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../../models/Users');
const { sendEmailWithNodeMailer } = require('../../utils/email');
const { authenticate, authorize } = require('../../middlewares/auth');

const JWT_SECRET = process.env.JWT_SECRET;
//middleware  to limit the number of request per hour from any IP address
const limiter = rateLimit({
	max: 10, //max no of request per IP in the specified time
	windowMs: 60 * 60 * 1000, //time allowed for the num of request(1h)
	message:
		'Maximum allowed login request in an hour exceeded, please try again in an hour time or try resetting your password', //
});

// get all users , restricted to admins and developers users
//working fine
router.get(
	'/',
	authenticate,
	authorize('admin', 'developer'),
	async (req, res) => {
		//this route can take parameters pass it by ?param=value

		try {
			// console.log(req.query);
			let requestQueryObject = { ...req.query }; //make a copy of the req.query object

			let excludedQueryField = ['sort', 'page', 'pageSize', 'fields']; //define keywords in the req.query that should not be considered while querying the database

			excludedQueryField.forEach(
				(element) => delete requestQueryObject[element]
			); //delete any key in the requestQueryObject containing an element in the  excludedQueryField  array

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
			//pass page and pageSize params  eg  ?page=1&pageSize=20

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
						message: 'This page does not exits',
					});
				}
			}

			//execute query
			const users = await query; // query.sort().select().skip().limit()

			return res.status(200).json({
				status: 'success',
				result: users.length,
				users,
			});
		} catch (error) {
			console.log(error);
			return res.status(400).json({
				status: 'Failed',
				error,
			});
		}
	}
);

//get single user, , restricted to admins and developers users
//working fine
router.get(
	'/:id',
	authenticate,
	authorize('admin', 'developer'),
	async (req, res) => {
		try {
			const user = await User.findById(req.params.id).select('-__v');
			if (!user) {
				return res.status(404).json({
					status: 'Failed',
					message: `No user with the id ${req.params.id}`,
				});
			}
			return res.status(200).json({
				status: 'success',
				user,
			});
		} catch (error) {
			console.log(error);
			return res.status(400).json({
				ststus: 'failed',
				error,
			});
		}
	}
);

//register a user
//working fine
router.post(
	'/signup',
	[
		check('name', 'Name  is requird').not().notEmpty(),
		check('email', 'Email is required').not().notEmpty(),
		check('email', 'Invalid email').isEmail(),
		check('phone', 'Phone number required').not().notEmpty(),
		check('password', 'Password required').notEmpty(),
		check('confirmPassword', 'confirmPassword required').notEmpty(),

		
	],
	async (req, res) => {
		const errors = validationResult(req.body);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'Failed', errors: errors.array() });
		}
		try {
			const { email } = req.body;
			const user = await User.findOne({ email });
			if (user) {
				return res.status(400).json({
					status: 'failed',
					message: 'user already exist!',
				});
			}
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm',
			});
			const userData = { ...req.body };
			userData.avatar = avatar;

			//commented because password is now hash  using a pre middleware in the User model
			// const salt = await bcrypt.genSalt(10);
			// userData.password = await bcrypt.hash(password, salt);

			const createUser = await User.create({
				name: userData.name,
				email: userData.email,
				avatar: userData.avatar,
				password: userData.password,
				address: userData.address,
				phone: userData.phone,
				confirmPassword: userData.confirmPassword,
				role: userData.role,
			});

			const payLoad = {
				user: {
					id: createUser.id,
				},
			};
			createUser.password = undefined;
			createUser.__v = undefined;
			createUser.role = undefined;
			jwt.sign(
				payLoad,
				JWT_SECRET,
				{ expiresIn: 3600 },
				async (error, token) => {
					if (error) throw error;

					const message = `Dear ${
						createUser.name.split(' ')[0]
					}, your Accout with EasyRent has been created successfully`;

					const mailOptions = {
						from: 'giftedbraintech@gmail.com',
						to: createUser.email,
						subject: 'Account created successfully',
						text: `Dear ${
							createUser.name.split(' ')[0]
						},your account has been successfully created`,
						html: `<div>
						<div  style="background-color:#f3f3f3; text-align:center;padding:10px">
											<div>
												<img src="http://www.giftedbraintech.com/img/giftedbrain_favicon.png" width="64" height="64"/>
											</div>
											<div style="padding=0px">
												<h3 style="padding=0px">Gifted<span style="color:#d0003c">Brain </span> Tech</h3>
											</div>
											<div style="padding=0px; padding-bottom:10px">
												<h5 style="padding=5px"><em>Building reliable technologies</em></h5>
											</div>
										</div>
						
						<div><p>Welecome ${
							createUser.name.split(' ')[0]
						} to GiftedBrainTech Blog</p></div>
						<div>${message}</div>
						<div>Login to your account and update your profile so you can start uploading your appartments for rent</div>
				
						<div>Follow giftedbraintech  on</div>
									<div style="background-color:#333;text-align:center; padding:10px">
										<div style="display:inline-block ; padding-right:10px">
											<a href="https://twitter.com/GiftedbrainTech" target="_blank">
												<img
													title="Share with a friend"
													src="http://www.giftedbraintech.com/img/twitter.png"
													alt="twitter"
												
													width="24"
													height="24"
												/>
											</a>
										</div>
										<div style="display:inline-block; padding-right:10px">
											<a href="https://fb.me/GiftedBrainTech" target="_blank">
												<img
													title="Share with a friend"
													src="http://www.giftedbraintech.com/img/facebook.png"
													alt="facebook"
													
													width="24"
													height="24"
												/>
											</a>
										</div>
										<div  style="display:inline-block; padding-right:10px">
											<a href="https://www.linkedin.com/in/giftedbraintech/" target="_blank">
												<img
													title="Share with a friend"
													src="http://www.giftedbraintech.com/img/linkedin.png"
													alt="whatsapp"
													
													width="24"
													height="24"
												/>
											</a>
										</div>
									</div>
									
										<div style="background-color:#333; color:#fff;text-align:center;padding:20px 10px">
											&copy; Copyright <strong>GiftedBrain Tech</strong> 2018 - 2020. All
											Rights Reserved
										</div>
						</div>`,
					};

					await sendEmailWithNodeMailer(mailOptions);

					return res.status(201).json({
						status: 'success',
						token,
						user: createUser,
					});
				}
			);
		} catch (error) {
			console.log(error);
			return res.status(400).json({
				status: 'failed',
				error,
			});
		}
	}
);

// user login route
//working fine
router.post(
	'/login',
	limiter,
	[
		check('email', 'Email is required').not().notEmpty(),
		check('password', 'Password required').exists(),
	],

	async (req, res) => {
		const errors = validationResult(req.body); // pass req.body for form data validation but for json, just pass req;
		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 'Failed',
				error: errors.array(),
			});
		}
		const { email, password } = req.body;
		try {
			console.log(User.find({}))
			const user = await User.find({email }).select('+password');
			console.log("user",user)

			if(!user){
				return res.status(400).json({
					status: 'Failed',
					message: 'Invalid user credentials',
				});
			}

			if (!(await user.isMatchPassword(password, user[0].password))) {
				console.log("password mismatch")
				return res.status(400).json({
					status: 'Failed',
					message: 'Invalid user credentials',
				});
			}

			const payLoad = {
				user: {
					id: user.id,
				},
			};
			user.password = undefined; //remove the password from what will be sent to the user
			user.__v = undefined;

			jwt.sign(payLoad, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
				if (error) throw error;

				//  to send token as cookie to the browser  use the code below

				res.cookie('token', token, {
					expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), //expires in 90days
					httpOnly: true,
					// secure: req.secure || req.headers('x-forwarded-proto') === 'https' //used only in production
				});

				//end of code to send token as cookie
				return res.status(200).json({
					status: 'success',
					token,
					user,
				});
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ status: 'Failed', error });
		}
	}
);

//send reset password link route
//working fine
router.post('/forgot-password', async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({
				status: 'Failed',
				message: `No email was provided, Please provide a valid email`,
			});
		}
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({
				status: 'Failed',
				message: `No user with the provided email ${email}`,
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

		//send the reset password mail
		try {
			const mailOptions = {
				from: 'giftedbraintech@gmail.com',
				to: user.email,
				subject: 'Password reset token (last for 5 minutes)',
				text: `Dear ${
					user.name.split(' ')[0]
				}, ${message}`,
				html: `<div>
				<div  style="background-color:#f3f3f3; text-align:center">
									<div>
										<img src="http://www.giftedbraintech.com/img/giftedbrain_favicon.png" width="64" height="64"/>
									</div>
									<div style="padding=0px">
										<h3 style="padding=0px">Gifted<span style="color:#d0003c">Brain </span> Tech</h3>
									</div>
									<div style="padding=0px; padding-bottom:10px">
										<h5 style="padding=5px"><em>Building reliable technologies</em></h5>
									</div>
								</div>
				
				<div><p>Password reset token </p></div>
				<div>${message}</div>
		
				<div>Follow giftedbraintech  on</div>
							<div style="background-color:#333;text-align:center;">
								<div style="display:inline-block ; padding-right:10px">
									<a href="https://twitter.com/GiftedbrainTech" target="_blank">
										<img
											title="Share with a friend"
											src="http://www.giftedbraintech.com/img/twitter.png"
											alt="twitter"
										
											width="24"
											height="24"
										/>
									</a>
								</div>
								<div style="display:inline-block; padding-right:10px">
									<a href="https://fb.me/GiftedBrainTech" target="_blank">
										<img
											title="Share with a friend"
											src="http://www.giftedbraintech.com/img/facebook.png"
											alt="facebook"
											
											width="24"
											height="24"
										/>
									</a>
								</div>
								<div  style="display:inline-block; padding-right:10px">
									<a href="https://www.linkedin.com/in/giftedbraintech/" target="_blank">
										<img
											title="Share with a friend"
											src="http://www.giftedbraintech.com/img/linkedin.png"
											alt="whatsapp"
											
											width="24"
											height="24"
										/>
									</a>
								</div>
							</div>
							
								<div style="background-color:#333; color:#fff;text-align:center;padding:20px 10px">
									&copy; Copyright <strong>GiftedBrain Tech</strong> 2018 - 2020. All
									Rights Reserved
								</div>
				</div>`,
			};

			await sendEmailWithNodeMailer(mailOptions);

			//send route response
			return res.status(200).json({
				status: 'success',
				message: `A password reset token has ben sent to your email address  ${user.email}, Login to you email to reset your password(token last for 10 minutes)`,
			});
		} catch (error) {
			//if the is an error while sending resettoken mail, set both passwordResetToken ,passwordResetTokenExpires to undefined and save
			user.passwordResetToken = undefined;
			user.passwordResetTokenExpires = undefined;
			await user.save({ validateBeforeSave: false });
			return res.status(500).json({
				status: 'Failed',
				message: 'There was an error sending the email please try again later',
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			message: error,
		});
	}
});

//reset password route
//working fine
router.patch('/reset-password/:token', async (req, res) => {
	try {
		//get user base on the reset password token sent to their mail
		const { token } = req.params;
		const { password, confirmPassword } = req.body;
		const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
		//check if there is user with the hashedtoken and also if the token has not expired
		const user = await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetTokenExpires: { $gt: Date.now() },
		}).select(
			'+password +confirmPassword +passwordResetToken +passwordResetTokenExpires'
		);
		//if no user is found
		if (!user) {
			return res.status(400).json({
				status: 'failed',
				message: 'Token invalid or has expires',
			});
		}
		//update user data and save
		user.password = password;
		user.confirmPassword = confirmPassword;
		user.passwordResetToken = undefined;
		user.passwordResetTokenExpires = undefined;
		await user.save();

		//log user in by assigning hin a token
		const payLoad = {
			user: {
				id: user.id,
			},
		};
		jwt.sign(payLoad, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
			if (error) throw error;
			return res.status(200).json({
				status: 'success',
				token,
			});
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			message: error,
		});
	}
});

//normal update password route
//working fine
router.patch('/update-password', authenticate, async (req, res) => {
	//get the submitted password
	const { oldPassword, newPassword, newConfirmPassword } = req.body;
	try {
		//get the user from the user collection
		let user = await User.findById(req.user.id).select(
			'+password +confirmPassword'
		);
		if (!user) {
			return res.status(404).json({
				status: 'Failed',
				message: 'User not found',
			});
		}

		// check if passwaord matches the one in the database
		let passwordIsMatch = await user.isMatchPassword(
			oldPassword,
			user.password
		);
		if (!passwordIsMatch) {
			return res.status(401).json({
				status: 'Failed',
				message: 'The password you entered is incorrect',
			});
		}
		user.password = newPassword;
		user.confirmPassword = newConfirmPassword;
		await user.save();

		// always use the save for password update and not findbyidandupdate in order to run the User model pre middlewares

		//log user in by assigning him a token
		const payLoad = {
			user: {
				id: user.id,
			},
		};
		jwt.sign(payLoad, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
			if (error) throw error;
			return res.status(200).json({
				status: 'success',
				token,
			});
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error,
		});
	}
});

//update other user data by user
//working fine
router.patch('/update-me', authenticate, async (req, res) => {
	try {
		//find the user
		//formal implementation
		// let updatedata = { ...req.body };
		// let excludedFields = ['password', 'confirmPassword', 'role'];

		//excludedFields.forEach((field) => delete updatedata[field]); //exclude the password,confirmpassword,role field from update data
		// const user = await User.findByIdAndUpdate(req.user.id, updatedata, {
		// 		new: true,
		// 		runValidators: true
		// 	});
		//update user data

		//more robust implementation
		const { password, confirmPassword ,role} = req.body;
		if (password || confirmPassword || role) {
			return res.status(400).json({
				status: 'Failed',
				message:
					'You cannot update password or role or confirm password from this route',
			});
		}

		let updatedata = { ...req.body };
		const excludedFields = [
			'password',
			'confirmPassword',
			'role',

			'passwordChangedAt',
			'passwordResetToken',
			'passwordResetTokenExpires',
		];

		excludedFields.forEach((field) => delete updatedata[field]); //exclude the password,confirmpassword,role field  etc from update data
		updatedata.isActiveUser=true
		const user = await User.findByIdAndUpdate(req.user.id, updatedata, {
			new: true,
			runValidators: true,
		});
		return res.status(200).json({
			status: 'success',
			user,
		});
		//send the updated user data
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error,
		});
	}
});

//modify user accout by user
//working fine
router.patch('/:id', authenticate, async (req, res) => {
	try {
		let updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).select('-password');
		return res.status(200).json({
			status: 'success',
			user: updatedUser,
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'failed',
			error,
		});
	}
});

//delete a user by admin
//working fine  //commented route because router cannot take more than 10 routes/endpoints
// router.delete('/:id', authenticate, authorize, async (req, res) => {
// 	try {
// 		await User.findByIdAndRemove(req.body.email);
// 		return res.status(204).json({
// 			status: 'success',
// 			message: `User with the id ${req.body.email} has been deleted`
// 		});
// 	} catch (error) {
// 		console.log(error);
// 		return res.status(400).json({
// 			status: 'failed',
// 			error
// 		});
// 	}
// });
//route for a user to deactivated his account
router.delete('/delete-me', authenticate, async (req, res) => {
	console.log('delete route');
	try {
		await User.findByIdAndUpdate(
			req.user.id,
			{
				isActiveUser: false,
			},
			{
				new: true,
				runValidators: true,
			}
		);
		return res.status(204).json({
			status: 'success',
			message: 'Acount deactivated successfully',
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error,
		});
	}
});

module.exports = router;

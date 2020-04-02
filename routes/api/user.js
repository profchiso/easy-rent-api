const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const User = require('../../models/Users');
const authorize = require('../../middlewares/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// get all users
router.get('/', authorize, async (req, res) => {
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'user home route'
	});
});

//get single user
router.get('/:id', authorize, async (req, res) => {
	console.log(req.params);
	const { id } = req.params.id;
	try {
		if (id) {
			const user = await User.findById(id);
			if (!user) {
				return res.status(404).json({
					status: 'failed',
					message: `User with the id ${id} does not exist`
				});
			}
			res.status(200).json({
				status: 'success',
				result: 1,
				data: user
			});
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({
			ststus: 'failed',
			error
		});
	}
});

//register a user
router.post(
	'/',
	[
		check('name', 'Name  is requird')
			.not()
			.notEmpty(),
		check('email', 'Email is required')
			.isEmail()
			.notEmpty(),
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
			const { email, password } = req.body;
			// const user = await User.findOne({ email });
			// if (user) {
			// 	return res.status(400).json({
			// 		status: 'failed',
			// 		message: 'user already exist!'
			// 	});
			// }
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			});
			const userData = req.body;
			userData.avatar = avatar;

			const salt = await bcrypt.genSalt(10);
			userData.password = await bcrypt.hash(password, salt);

			const createUser = await User.create(userData);

			const payLoad = {
				user: {
					id: createUser.id
				}
			};
			jwt.sign(payLoad, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
				if (error) throw error;
				res.status(201).json({
					status: 'success',
					result: 1,
					data: createUser,
					token
				});
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				status: 'failed',
				error
			});
		}
	}
);

//modify user accout
router.patch('/:id', authorize, async (req, res) => {
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'modify a user route'
	});
});

//delete a user
router.delete('/:id', authorize, async (req, res) => {
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'delete a user  route'
	});
});

module.exports = router;

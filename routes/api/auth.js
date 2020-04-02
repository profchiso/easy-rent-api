const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const authorize = require('../../middlewares/auth');
const User = require('./../../models/Users');
const JWT_SECRET = process.env.JWT_SECRET;

router.get('/', authorize, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select(
			'-password -__v -createdAt'
		);
		res.status(200).json({ status: 'success', result: 1, user });
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ status: 'Failed', message: 'Internal server error' });
	}
});

router.post(
	'/',
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
			const user = await User.findOne({ email });
			console.log(user);
			if (!user) {
				return res.status(404).json({
					status: 'Failed',
					message: 'Invalid user credentials'
				});
			}
			const isMatchedPassword = await bcrypt.compare(password, user.password);
			if (!isMatchedPassword) {
				return res.status(404).json({
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
				res.status(201).json({
					status: 'success',
					result: 1,
					token
				});
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ status: 'Failed', error });
		}
	}
);

module.exports = router;

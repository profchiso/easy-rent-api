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
router.get('/', async (req, res) => {
	//this route can take parameters pass it by ?param=value

	try {
		// console.log(req.query);
		let requestQueryObject = { ...req.query }; //make a copy of the req.query object

		let excludedQueryField = ['sort', 'page', 'pageSize', 'fields']; //define keywords in the req.query that should not be considered while querying the database

		excludedQueryField.forEach((element) => delete requestQueryObject[element]); //delete any key in the requestQueryObject containing an allement in the  excludedQueryField  array

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

		res.status(200).json({
			status: 'success',
			result: users.length,
			data: users
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//get single user
router.get('/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id).select('-password -__v');
		res.status(200).json({
			status: 'success',

			data: user
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			ststus: 'failed',
			error
		});
	}
});

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
			const { email, password } = req.body;
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
			const payLoad = {
				user: {
					id: createUser.id
				}
			};
			jwt.sign(payLoad, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
				if (error) throw error;
				res.status(201).json({
					status: 'success',
					token
				});
			});
		} catch (error) {
			console.log(error);
			res.status(400).json({
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
			const user = await User.findOne({ email });

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
				res.status(200).json({
					status: 'success',
					token
				});
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ status: 'Failed', error });
		}
	}
);

//modify user accout
router.patch('/:id', async (req, res) => {
	try {
		let updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		}).select('-password');
		res.status(200).json({
			status: 'success',
			data: updatedUser
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			status: 'failed',
			error
		});
	}
});

//delete a user
router.delete('/:id', async (req, res) => {
	try {
		await User.findByIdAndRemove(req.params.id).select('-password');
		res.status(204).json({
			status: 'success',
			message: `User with the id ${req.params.id} has been deleted`
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			status: 'failed',
			error
		});
	}
});

module.exports = router;

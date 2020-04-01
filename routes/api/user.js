const express = require('express');
const router = express.Router();
const User = require('../../models/Users');

// get all users
router.get('/', async (req, res) => {
	console.log('get all users route');
	console.log(req.params);
	console.log(req.query);
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'user home route'
	});
});

//get single user
router.get('/:id', async (req, res) => {
	console.log('get a users route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'get a user route'
	});
});

//register a user
router.post('/', async (req, res) => {
	console.log('add users route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'add a user route'
	});
});

//modify user accout
router.patch('/:id', async (req, res) => {
	console.log('modify user accout route');

	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'modify a user route'
	});
});

//delete a user
router.delete('/:id', async (req, res) => {
	console.log('delete user accout route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'delete a user  route'
	});
});

module.exports = router;

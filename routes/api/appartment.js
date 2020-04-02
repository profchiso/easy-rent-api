const express = require('express');
const router = express.Router();
const validator = require('express-validator');
const Appartment = require('../../models/Appartment');
const authorize = require('../../middlewares/auth');

// get all appartments
router.get('/', async (req, res) => {
	console.log('get all appartments route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'appartment home route'
	});
});

//get single appartment
router.get('/:id', async (req, res) => {
	console.log('get single appartments route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'get an appartment route'
	});
});

//get all appartment belonging to one user
router.get('/user-appartments/:userID', authorize, async (req, res) => {
	console.log('get all appartment belonging to one user route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'get all appartment for a user route'
	});
});

//add an appartment
router.post('/', authorize, async (req, res) => {
	console.log('add appartments route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'add appartment route'
	});
});

//modify an appartment
router.patch('/:id', authorize, async (req, res) => {
	console.log('modify an appartments route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'modify appartment route'
	});
});

//delete an appartment
router.delete('/:id', authorize, async (req, res) => {
	console.log('delete appartments route');

	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'delete appartment route'
	});
});

module.exports = router;

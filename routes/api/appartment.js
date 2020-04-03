const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Appartment = require('../../models/Appartment');
const authorize = require('../../middlewares/auth');

// get all appartments
router.get('/', async (req, res) => {
	try {
		let appartments = await Appartment.find();

		res.status(200).json({
			status: 'success',
			result: appartments.length,
			data: appartments
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 'Failed',
			error
		});
	}
});

//get single appartment
router.get('/:id', async (req, res) => {
	try {
		let appartment = await Appartment.findById(req.params.id);

		if (!appartment) {
			return res.status(404).json({
				status: 'Failed',
				result: 0,
				message: `No result for the id ${req.params.id}`
			});
		}

		res.status(200).json({
			status: 'success',
			result: appartment.length,
			data: appartment
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//get all appartment belonging to one user
router.get('/user-appartments/:userID', authorize, async (req, res) => {
	try {
		let userAppartments = await Appartment.find({
			'user.id': req.params.userID
		});

		res.status(200).json({
			status: 'success',
			result: userAppartments.length,
			data: userAppartments
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//add an appartment
router.post('/', [], authorize, async (req, res) => {
	console.log('add appartments route');
	res.status(200).json({
		status: 'success',
		result: 1,
		data: 'add appartment route'
	});
});

//modify an appartment
router.patch('/:id', authorize, async (req, res) => {
	try {
		let updatedAppartment = await Appartment.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);

		res.status(200).json({
			status: 'success',
			result: updatedAppartment.length,
			data: updatedAppartment
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//delete an appartment
router.delete('/:id', authorize, async (req, res) => {
	try {
		await Appartment.findByIdAndDelete(req.params.id);

		res.status(204).json({
			status: 'success',
			message: 'Appartment deleted !'
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

module.exports = router;

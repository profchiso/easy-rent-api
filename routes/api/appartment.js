const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Appartment = require('../../models/Appartment');
const { authanticate, authorize } = require('../../middlewares/auth');

// get all appartments
router.get('/', async (req, res) => {
	try {
		let appartments = await Appartment.find();

		return res.status(200).json({
			status: 'success',
			result: appartments.length,
			data: appartments
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
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

		return res.status(200).json({
			status: 'success',
			result: appartment.length,
			data: appartment
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//get all appartment belonging to one user
router.get('/user-appartments/:userID', authanticate, async (req, res) => {
	try {
		let userAppartments = await Appartment.find({
			'user.id': req.params.userID
		});

		return res.status(200).json({
			status: 'success',
			result: userAppartments.length,
			data: userAppartments
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//add an appartment
router.post('/', [], authanticate, async (req, res) => {
	console.log('add appartments route');
	return res.status(200).json({
		status: 'success',
		result: 1,
		data: 'add appartment route'
	});
});

//modify an appartment
router.patch('/:id', authanticate, async (req, res) => {
	try {
		let updatedAppartment = await Appartment.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);

		return res.status(200).json({
			status: 'success',
			result: updatedAppartment.length,
			data: updatedAppartment
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//delete an appartment, , restricted to admins developers and  users
router.delete(
	'/:id',
	authanticate,
	authorize('admin', 'developer', 'user'),
	async (req, res) => {
		try {
			await Appartment.findByIdAndDelete(req.params.id);

			return res.status(204).json({
				status: 'success',
				message: 'Appartment deleted !'
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

module.exports = router;

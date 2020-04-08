const express = require('express');
const router = express.Router();
const multer = require('multer');
const { check, validationResult } = require('express-validator');
const Appartment = require('../../models/Appartment');
const User = require('../../models/Users');
const { authenticate, authorize } = require('../../middlewares/auth');
const multerStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/img/appartment-img');
	},
	filename: (req, files, cb) => {
		const [houseImage, toiletImage] = req.files;
		const houseimageExt = houseImage.mimetype.split('/')[1];
		const toiletimageExt = toiletImage.mimetype.split('/')[1];
		cb(
			null,
			`${req.user.id}-${houseImage.filename}-${Date.now()}.${houseimageExt}`
		);
		cb(
			null,
			`${req.user.id}-${toiletImage.filename}-${Date.now()}.${toiletimageExt}`
		);
	}
});

//filter for images
const multerFilters = (req, file, cb) => {
	const [houseImage, toiletImage] = req.files;
	if (
		houseImage.mimetype.startWith('image') &&
		toiletImage.mimetype.startWith('image')
	) {
		cb(null, true);
	}
	cb(new Error('not an image'), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilters });

// get all appartments
router.get('/', async (req, res) => {
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

		let query = Appartment.find(JSON.parse(queryToString)).populate({
			path: 'user',
			select: '-__v -role -createdAt'
		}); // the .select excludes any spacified field before sending the document

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
			query = query.select('-__v');
		}

		//pagination
		//pass page and pageSize params  eg  ?page=1&pageSize=20

		const page = req.query.page * 1 || 1;
		const pageSize = req.query.pageSize * 1 || 50;
		const skip = (page - 1) * pageSize;
		query = query.skip(skip).limit(pageSize);

		//handle a case where user specify page that does not exists
		if (req.query.page) {
			let numberOfDocument = await Appartment.countDocuments();
			if (skip >= numberOfDocument) {
				return res.status(404).json({
					status: 'failed',
					result: 0,
					message: 'This page does not exits'
				});
			}
		}

		//execute query
		const appartments = await query; // query.sort().select().skip().limit()

		return res.status(200).json({
			status: 'success',
			result: appartments.length,
			appartments
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
		let appartment = await Appartment.findById(req.params.id).populate({
			path: 'user',
			select: '-__v -role -createdAt'
		}); //.populate fill the selected field with its data from the collection where it is referenced

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
router.get('/user-appartments/:userID', authenticate, async (req, res) => {
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

//upload.single("fieldname") for single image upload from multer,
//upload.array("fieldname",limitupload) for multiple image upload where limitupload = number of expected image can be more but cannot be less
router.post('/', authenticate, upload.array('images', 3), async (req, res) => {
	const [house, toilet] = req.files;
	console.log(house, toilet);

	try {
		// const user = await User.findById(req.user.id).select(
		// 	'-__v -createdAt -role'
		// );
		// req.body.user = req.user.id;
		// const newAppartment = await Appartment.create(req.body);

		return res.status(200).json({
			status: 'success'
			// result: newAppartment.length,
			// appartment: newAppartment
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error
		});
	}
});

//modify an appartment
router.patch('/:id', authenticate, async (req, res) => {
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
	authenticate,
	authorize('admin', 'user'),
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

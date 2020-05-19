const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { check, validationResult } = require('express-validator');
const Appartment = require('../../models/Appartment');
//const User = require('../../models/Users');
const { authenticate, authorize } = require('../../middlewares/auth');

//store image upload in a disk
// const multerStorage = multer.diskStorage({
// 	destination: (req, file, cb) => {
// 		cb(null, 'public/img/appartment-img');
// 	},
// 	filename: (req, files, cb) => {
// 		const [houseImage, toiletImage] = req.files;
// 		const houseimageExt = houseImage.mimetype.split('/')[1];
// 		const toiletimageExt = toiletImage.mimetype.split('/')[1];
// 		cb(
// 			null,
// 			`${req.user.id}-${houseImage.filename}-${Date.now()}.${houseimageExt}`
// 		);
// 		cb(
// 			null,
// 			`${req.user.id}-${toiletImage.filename}-${Date.now()}.${toiletimageExt}`
// 		);
// 	}
// });

//store uploaded image in the memory
const multerStorage = multer.memoryStorage();

//filter for images
const multerFilters = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new Error('Not an image'), false);
	}
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilters });

// get all appartments
//working fine
router.get('/', async (req, res) => {
	try {
		// console.log(req.query);
		let requestQueryObject = { ...req.query }; //make a copy of the req.query object

		let excludedQueryField = ['sort', 'page', 'pageSize', 'fields']; //define keywords in the req.query that should not be considered while querying the database

		excludedQueryField.forEach((element) => delete requestQueryObject[element]); //delete any key in the requestQueryObject containing an element in the  excludedQueryField  array

		//advance query using gte,lte,gt,lt
		let queryToString = JSON.stringify(requestQueryObject);
		queryToString = queryToString.replace(
			/\b(gte|lte|gt|lt)\b/g,
			(match) => `$${match}`
		);

		let query = Appartment.find(JSON.parse(queryToString)).populate({
			path: 'user',
			select: '-__v -role -createdAt',
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
		//pass a parameter called field eg. ?fields=field1,field2,... to select the fields you want to see in the returned query
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
					message: 'This page does not exits',
				});
			}
		}

		//execute query
		const appartments = await query; // query.sort().select().skip().limit()

		return res.status(200).json({
			status: 'success',
			result: appartments.length,
			appartments,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: 'Failed',
			error,
		});
	}
});

//get single appartment
//working fine
router.get('/:id', async (req, res) => {
	try {
		let appartment = await Appartment.findById(req.params.id).populate({
			path: 'user',
			select: '-__v -role -createdAt',
		}); //.populate fill the selected field with its data from the collection where it is referenced

		if (!appartment) {
			return res.status(404).json({
				status: 'Failed',
				result: 0,
				message: `No result for the id ${req.params.id}`,
			});
		}

		return res.status(200).json({
			status: 'success',
			result: appartment.length,
			data: appartment,
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error,
		});
	}
});

//get all appartment belonging to one user
//working fine
router.get(
	'/user-appartments/my-appartments',
	authenticate,
	async (req, res) => {
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
			let toFind = JSON.parse(queryToString);
			toFind.userId = req.user.id;

			let query = Appartment.find(toFind).populate({
				path: 'user',
				select: '-__v -role -createdAt',
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
			//pass a parameter called field eg. ?fields=field1,field2,... to select the fields you want to see in the returned query
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
						message: 'This page does not exits',
					});
				}
			}

			//execute query
			const appartments = await query; // query.sort().select().skip().limit()

			return res.status(200).json({
				status: 'success',
				result: appartments.length,
				appartments,
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

//add an appartment

//upload.single("fieldname") for single image upload from multer,
//upload.array("fieldname",limitupload) for multiple image upload where limitupload = number of expected image can be more but cannot be less and the images have the same fieldname,
//upload.fields([{ name: 'houseImage', maxCount: 1 },{ name: 'toiletImage', maxCount: 1 },]) to upload multiple images with different fieldname

//working fine
router.post(
	'/',
	authenticate,
	[
		check('houseName', 'houseName is requird').not().notEmpty(),
		check('state', 'state is requird').not().notEmpty(),
		check('LGA', 'LGA is requird').not().notEmpty(),
		check('LGA', 'LGA is requird').not().notEmpty(),
		check('priceRange', 'priceRange is requird').not().notEmpty(),
	],
	upload.fields([
		{ name: 'houseImage', maxCount: 1 },
		{ name: 'images', maxCount: 3 },
	]),
	async (req, res) => {
		const errors = validationResult(req.body);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'Failed', errors: errors.array() });
		}
		try {
			req.body.user = req.user.id;
			if (req.files.houseImage || req.files.images) {
				//process house image
				req.body.houseImage = `http://www.easy-rent-api.com/img/appartment-img/${
					req.user.id
				}-${req.files.houseImage[0].fieldname}-${Date.now()}.jpeg`;

				await sharp(req.files.houseImage[0].buffer)
					.resize(2000, 1333)
					.toFormat('jpeg')
					.jpeg({ quality: 90 })
					.toFile(`public/img/appartment-img/${req.body.houseImage}`);

				//process other images
				req.body.images = [];
				await Promise.all(
					req.files.images.map(async (image, i) => {
						const fileName = `http://www.easy-rent-api.com/img/appartment-img/${
							req.user.id
						}-${image.fieldname}-${Date.now()}-${i + 1}.jpeg`;

						await sharp(image.buffer)
							.resize(2000, 1333)
							.toFormat('jpeg')
							.jpeg({ quality: 90 })
							.toFile(`public/img/appartment-img/${fileName}`);

						req.body.images.push(fileName);
					})
				);
			}
			req.body.userId = req.user.id;

			const newAppartment = await Appartment.create(req.body);

			return res.status(200).json({
				status: 'success',
				result: newAppartment.length,
				appartment: newAppartment,
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

//modify an appartment
//working partially
router.patch('/:id', authenticate, async (req, res) => {
	console.log(req.body);

	try {
		let updatedAppartment = await Appartment.findByIdAndUpdate(
			req.params.id,
			req.body
		);

		return res.status(200).json({
			status: 'success',
			result: updatedAppartment.length,
			data: updatedAppartment,
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			status: 'Failed',
			error,
		});
	}
});

//delete an appartment, , restricted to admins developers and  users
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
	console.log('appment delete');
	try {
		await Appartment.findByIdAndDelete(req.params.id);

		return res.status(204).json({
			status: 'success',
			message: 'Appartment deleted !',
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

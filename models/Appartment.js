const mongoose = require('mongoose');

const appartmentSchema = new mongoose.Schema({
	houseName: {
		type: String
	},
	houseNumber: {
		type: String
	},
	houseType: {
		type: String
	},
	houseImage: [String],
	gps: {
		type: {
			type: String,
			default: 'Point',
			enum: 'Point'
		},
		coodinate: [Number],
		address: String
	},
	dateUploaded: {
		type: Date,
		default: Date.now()
	},
	isRented: {
		type: Boolean,
		default: false
	},
	priceRange: {
		type: String
		// required: true
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'user',
		required: true
	},
	isDeleted: {
		type: Boolean,
		default: false
	}
});

//pre middleware to populate the user field from the user collection
// appartmentSchema.pre('save', async function(next) {
// 	this.user = await User.findById(req.user.id).select(
// 		'+name +email +phone +address +avatar'
// 	);
// 	next();
// });
const Appartment = mongoose.model('appartment', appartmentSchema);
module.exports = Appartment;

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
		latitude: {
			type: Number
		},
		longitude: {
			type: Number
		}
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
		type: String,
		required: true
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user'
	},
	isDeleted: {
		type: Boolean,
		default: false
	}
});
const Appartment = mongoose.model('appartment', appartmentSchema);
module.exports = Appartment;

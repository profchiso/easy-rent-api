const mongoose = require("mongoose");

const appartmentSchema = new mongoose.Schema({
	houseName: {
		type: String,
		required: true,
	},
	houseAddress: {
		type: String,
	},
	houseType: {
		type: String,
	},
	state: {
		type: String,
		required: true,
	},
	LGA: {
		type: String,
		required: true,
	},
	houseImage: String,
	images: [String],
	location: {
		latitude: Number,
		longitude: Number,
	},
	dateUploaded: {
		type: Date,
		default: Date.now(),
	},
	isRented: {
		type: Boolean,
		default: false,
	},
	price: {
		type: Number,
		required: true,
	},

	userId: String,
	user: {
		type: mongoose.Schema.ObjectId,
		ref: "user",
		required: true,
	},
	isDeleted: {
		type: Boolean,
		default: false,
	},
	isVerified: {
		type: Boolean,
		default: false,
	},
	subscriptionType: {
		type: String,
		default: "basic",
	},
});

//pre middleware to populate the user field from the user collection
// appartmentSchema.pre('save', async function(next) {
// 	this.user = await User.findById(req.user.id).select(
// 		'+name +email +phone +address +avatar'
// 	);
// 	next();
// });
appartmentSchema.pre("/^find/", function (next) {
	this.populate({
		path: "user",
		select: "-__v -role -createdAt",
	});
});
const Appartment = mongoose.model("Appartment", appartmentSchema);
module.exports = Appartment;

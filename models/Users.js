const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: ['true', 'Please provide a name']
	},
	email: {
		type: String,
		unique: true,
		required: ['true', 'Valid email address required']
	},
	password: {
		type: String,
		required: true,
		select: false
	},
	address: {
		type: String,
		required: ['true', 'Please provide a valid address']
	},
	phone: {
		type: String,
		required: ['true', 'Please provide a valid  mobile number'],
		min: ['11', 'Mobile number must be 11 digit']
	},
	avatar: String,
	createdAt: {
		type: Date,
		default: Date.now()
	}
});
const User = mongoose.model('user', userSchema);
module.exports = User;

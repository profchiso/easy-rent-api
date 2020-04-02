const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: ['true', 'Please provide a name'],
		trim: true
	},
	email: {
		type: String,
		unique: true,
		required: ['true', 'Valid email address required'],
		lowercase: true,
		validate: [validator.isEmail, 'Invalid email']
	},
	password: {
		type: String,
		required: true
	},
	address: {
		type: String,
		required: ['true', 'Please provide a valid address'],
		trim: true
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
	},
	role: {
		type: String,
		default: 'user'
	}
});
userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 10);
	this.confirmPassword = undefined;
	next();
});
const User = mongoose.model('user', userSchema);
module.exports = User;

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
		required: true,
		select: false //excludes the password while returnin user data
	},
	passwordChangedAt: Date,
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

//mongoose pre middleware to t hash password before saving it to database
userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 10);
	this.confirmPassword = undefined; //removes the confirmpassword field from the req.body before saving to database
	next();
});

//instant middleware function to validate password on login
userSchema.methods.isMatchPassword = async function(
	enteredPassword,
	userpassword
) {
	return await bcrypt.compare(enteredPassword, userpassword);
};

//instance middle function to check if user changed password after a jwt token was isssued
userSchema.methods.checkIfUserChangedPasswordAfterJWTToken = async function(
	JWTTimeStamp
) {
	//check if the user has changed password
	if (this.passwordChangedAt) {
		let changePasswordTimeStamp = parseInt(
			this.passwordChangedAt.getTime() / 1000,
			10
		); // convert to timestamp to be uniform with the iat timestamp that the jwt provides, divided by 1000 to change  from millseconds to seconds, also second parameter of parseInt convert the result to base 10

		console.log(changePasswordTimeStamp, JWTTimeStamp);

		return JWTTimeStamp < changePasswordTimeStamp;
	}
	return false;
};
const User = mongoose.model('user', userSchema);
module.exports = User;

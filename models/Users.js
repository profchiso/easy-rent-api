const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: ['true', 'Please provide a name'],
		trim: true,
	},
	email: {
		type: String,
		unique: true,
		required: ['true', 'Valid email address required'],
		lowercase: true,
		validate: [validator.isEmail, 'Invalid email'],
	},
	phone: {
		type: String,
		required: ['true', 'Please provide a valid  mobile number'],
	},
	password: {
		type: String,
		select: false, //excludes the password while returnin user data
		//required: true,
	},
	googleId: String,
	facebookId: String,
	twitterId: String,
	oauthEmail: String,
	confirmPassword: {
		type: String,
		select: false,
		//required: true,

		//validate: {
		//workes only for create and save and not update
		//validator: function (val) {
		//return val === this.password;
		//},
		//message: 'Password and confirm password does not match',
		//},
	},
	passwordChangedAt: Date,
	address: {
		type: String,
		// required: ['true', 'Please provide a valid address'],
		trim: true,
	},

	avatar: String,
	createdAt: {
		type: Date,
		default: Date.now(),
	},
	role: {
		type: String,
		enum: ['user', 'admin', 'developer'],
		default: 'user',
	},
	passwordResetToken: {
		type: String,
		select: false,
	},
	passwordResetTokenExpires: {
		type: Date,
		select: false,
	},
	isActiveUser: {
		type: Boolean,
		default: false,
	},
	isSubscribed: {
		type: Boolean,
		default: true,
	},
	subscriptionType: {
		type: String,
		enum: ['basic', 'silver', 'gold', 'diamond'],
		default: 'basic',
	},
	subscriptionDate:{
		type: Date,
		default: Date.now(),
	},
	subscriptionExpiration:{
		type: Date,
		default: Date.now() + 30,
	},

	subscriptionHistory: [
		{
			month: String,
			year: Number,
			subscriptionType: String,
			subscriptionAmount: Number,
			subscriptionDate: {
				type: Date,
				default: Date.now(),
			},
		},
	],
});

//mongoose pre middleware to t hash password before saving it to database
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 10);
	this.confirmPassword = undefined; //removes the confirmpassword field from the req.body before saving to database
	next();
});

//mongoose pre middleware to run when there  is reset password action
userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) {
		return next();
	}
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

//instant middleware function to validate password on login
userSchema.methods.isMatchPassword = async function (
	enteredPassword,
	userpassword
) {
	console.log('password check', bcrypt.compare(enteredPassword, userpassword));
	return await bcrypt.compare(enteredPassword, userpassword);
};

//instance middleware function to check if user changed password after a jwt token was isssued
userSchema.methods.checkIfUserChangedPasswordAfterJWTToken = async function (
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

//instance middleware function to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
	const resetPasswordToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetPasswordToken)
		.digest('hex');
	this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // pick the current time and add 10 ie(10*60) minutes to it and convert to milliseconds by multiplying with 1000

	return resetPasswordToken;
};

// query middleware to not return user with isActiveUser=== false
userSchema.pre(/^find/, function (next) {
	//  this.find({ isActiveUser: { $ne: false } }); //return only active users
	next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;

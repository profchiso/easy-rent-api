const mongoose = require('mongoose');

const connectToDb = async () => {
	try {
		const DB_URL = process.env.DB_URL;
		await mongoose.connect(DB_URL, {
			useCreateIndex: true,
			useUnifiedTopology: true,
			useNewUrlParser: true,
			useFindAndModify: false
		});
		console.log('DB connection successful');
	} catch (err) {
		console.log(" DB Error===",err)
		console.log(err);
		process.exit(1); // kill the process if db connection is not successful
	}
};
module.exports = connectToDb;

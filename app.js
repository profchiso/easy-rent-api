require('dotenv').config();
const express = require('express');

const connectToDB = require('./controllers/dbController');
const userRoute = require('./routes/api/user');
const appartmentRoute = require('./routes/api/appartment');

connectToDB();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json({ extended: false }));

app.use('/easy-rent/api/v1/users', userRoute);
app.use('/easy-rent/api/v1/appartment', appartmentRoute);

app.all('*', (req, res) => {
	res.status(404).json({
		status: 'fail',
		message: 'Invalid Route'
	});
});

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});

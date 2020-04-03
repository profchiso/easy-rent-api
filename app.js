//NPM modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');

//user defined modules
const connectToDB = require('./controllers/dbController');
const userRoute = require('./routes/api/user');
const appartmentRoute = require('./routes/api/appartment');
const authRoute = require('./routes/api/auth');
const undefinedRoutes = require('./routes/api/404-routes');

connectToDB();

const PORT = process.env.PORT || 5000;

const app = express();
//console.log(parseInt('2280873', 8));
//middlewares
app.use(express.json({ extended: false }));
app.use(cors());

//routes
app.use('/easy-rent/api/v1/users', userRoute);
app.use('/easy-rent/api/v1/appartment', appartmentRoute);
// app.use('/easy-rent/api/v1/auth', authRoute);

//catch undefined endpoints
app.use(undefinedRoutes);

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});

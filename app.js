//NPM modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const bodyParser = require('body-parser');

//user defined modules
const connectToDB = require('./controllers/dbController');
const userRoute = require('./routes/api/user');
const appartmentRoute = require('./routes/api/appartment');
const undefinedRoutes = require('./routes/api/404-routes');

connectToDB(); //function to connect to database

const PORT = process.env.PORT || 5000;

const app = express();
app.enable('trust proxy');
//middlewares

//middleware to set security HTTP headers
app.use(helmet());

//middleware  to limit the number of request per hour from any IP address
const limiter = rateLimit({
	max: 300, //max no of request per IP in the specified time
	windowMs: 60 * 60 * 1000, //time allowed for the num of request
	message:
		'Maximum allowed request  for an IP in an hour exceeded, please try again in an hour time', //
});
app.use('/easy-rent/api/', limiter); //sends statusCode 429 which means too many request when limit is exceeded, always used to curb brute-force attack
app.use(express.json({ extended: false })); //middleware for body-paser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors()); //middle ware to allow cross origin resource sharing

//protect DB from NOSQL query injections using the express-mongo-sanitize middleware
// interset the req.body, req.params, and req.query and remove malicious codes
app.use(mongoSanitizer());

//protect data from xss attack using the xss-clean middleware
// work on HTML to sanitize the data from malicious script
app.use(xss());

//protect against parameter pollution using the hpp middleware
//works on url parameters to sanitize it eg. remove duplicate parameters
app.use(hpp({ whitelist: [] })); // use the whitelist option to specify some parameter that you want to allow duplicate in the array

//routes
app.get("/",(req,res)=>{
	res.status(200).send("welcome to easy rent api")
})
app.use('/easy-rent/api/v1/users', userRoute); //users route
app.use('/easy-rent/api/v1/appartment', appartmentRoute); //appartment route
// app.use('/easy-rent/api/v1/auth', authRoute);

//catch undefined endpoints
app.use(undefinedRoutes);

//spin up the server on the env port number
app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});

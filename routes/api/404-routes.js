const express = require('express');
const router = express.Router();

router.all('*', (req, res) => {
			console.log("baseURL===",req.baseUrl);
			console.log("hostname===",req.hostname);
			console.log("ip===", req.ip)
	res.status(404).json({
		status: 'fail',
		message: 'Invalid Endpoint',
		statusCode: 404
	});
});
module.exports = router;

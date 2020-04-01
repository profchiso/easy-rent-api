const express = require('express');
const router = express.Router();

router.all('*', (req, res) => {
	res.status(404).json({
		status: 'fail',
		message: 'Invalid Endpoint'
	});
});
module.exports = router;

const express = require('express');
const router = express.Router();

router.use('/stripe', require('./stripe'));
router.use('/flutterwave', require('./flutterwave'));
router.use('/webhooks', require('./webhooks'));
router.use('/catalog', require('./catalog'));

module.exports = router;

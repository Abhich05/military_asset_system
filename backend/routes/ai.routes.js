const router = require('express').Router();

const aiController = require('../controllers/ai.controller');

// AI-style endpoints (forecast, anomaly alerts, purchase recommendations).
router.get('/forecast', aiController.forecast);
router.get('/alerts', aiController.alerts);
router.get('/recommend-purchase', aiController.recommendPurchase);

module.exports = router;


const router = require('express').Router();
const { getBases, getEquipmentTypes, getAssets, getDashboardSummary } = require('../controllers/assets.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/bases', requireAuth, getBases);
router.get('/equipment-types', requireAuth, getEquipmentTypes);
router.get('/assets', requireAuth, getAssets);
router.get('/dashboard/summary', requireAuth, getDashboardSummary);

module.exports = router;

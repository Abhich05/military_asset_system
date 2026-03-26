const router = require('express').Router();
const { getPurchases, createPurchase, deletePurchase } = require('../controllers/purchases.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRoles } = require('../middleware/rbac.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');

router.get('/', requireAuth, getPurchases);
router.post('/', requireAuth, requireRoles(['Admin', 'BaseCommander', 'LogisticsOfficer']), auditLog('CREATE', 'purchase'), createPurchase);
router.delete('/:id', requireAuth, requireRoles('Admin'), auditLog('DELETE', 'purchase'), deletePurchase);

module.exports = router;

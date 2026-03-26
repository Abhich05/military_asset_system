const router = require('express').Router();
const { getTransfers, createTransfer } = require('../controllers/transfers.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRoles } = require('../middleware/rbac.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');

router.get('/', requireAuth, getTransfers);
router.post('/', requireAuth, requireRoles(['Admin', 'BaseCommander', 'LogisticsOfficer']), auditLog('CREATE', 'transfer'), createTransfer);

module.exports = router;

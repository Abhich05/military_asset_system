const router = require('express').Router();
const {
  getExpenditures, createExpenditure,
  getAssignments, createAssignment,
  getAuditLog
} = require('../controllers/expenditures.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRoles } = require('../middleware/rbac.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');

router.get('/expenditures', requireAuth, getExpenditures);
router.post('/expenditures', requireAuth, requireRoles(['Admin', 'BaseCommander', 'LogisticsOfficer']), auditLog('CREATE', 'expenditure'), createExpenditure);

router.get('/assignments', requireAuth, getAssignments);
router.post('/assignments', requireAuth, requireRoles(['Admin', 'BaseCommander']), auditLog('CREATE', 'assignment'), createAssignment);

router.get('/audit-log', requireAuth, requireRoles('Admin'), getAuditLog);

module.exports = router;

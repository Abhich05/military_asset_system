const router = require('express').Router();
const { login, me, getUsers, createUser } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRoles } = require('../middleware/rbac.middleware');

router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/users', requireAuth, requireRoles('Admin'), getUsers);
router.post('/users', requireAuth, requireRoles('Admin'), createUser);

module.exports = router;

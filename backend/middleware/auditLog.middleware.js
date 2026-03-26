const { query } = require('../config/db');

function auditLog(action, entityType) {
  return function auditLogMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (data && data.ok !== false) {
        const entityId = data.id || data.data?.id || null;
        const metadata = JSON.stringify({
          body: req.body,
          params: req.params,
          query: req.query
        });
        try {
          query(
            'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata, ip_address) VALUES (?,?,?,?,?,?)',
            [req.user?.id || null, action, entityType, entityId, metadata, req.ip || null]
          );
        } catch (_e) { /* silent — audit must not block */ }
      }
      return originalJson(data);
    };
    next();
  };
}

module.exports = { auditLog };

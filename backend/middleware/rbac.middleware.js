/**
 * RBAC Middleware
 * Roles: Admin > BaseCommander > LogisticsOfficer
 * 
 * Admin: full system access
 * BaseCommander: manage their own base assets, approve transfers
 * LogisticsOfficer: record purchases, transfers, expenditures (their base only)
 */
function requireRoles(roles) {
  const allowed = new Set(Array.isArray(roles) ? roles : [roles]);
  return function (req, res, next) {
    const userRole = req.user && req.user.role;
    if (!userRole || !allowed.has(userRole)) {
      return res.status(403).json({
        ok: false,
        error: `Access denied. Required role: ${[...allowed].join(' or ')}. Your role: ${userRole || 'none'}`
      });
    }
    next();
  };
}

/**
 * For BaseCommander and LogisticsOfficer, restrict to their own base.
 * Admins can access any base.
 * Expects base_id to be in req.params, req.body, or req.query.
 */
function restrictToOwnBase(req, res, next) {
  const { role, base_id: userBaseId } = req.user || {};
  if (role === 'Admin') return next();

  const requestedBaseId = Number(
    req.params.base_id || req.body.base_id || req.query.base_id || req.body.from_base_id
  );

  if (!requestedBaseId || requestedBaseId !== Number(userBaseId)) {
    return res.status(403).json({
      ok: false,
      error: 'Access denied. You can only manage assets for your own base.'
    });
  }
  next();
}

module.exports = { requireRoles, restrictToOwnBase };

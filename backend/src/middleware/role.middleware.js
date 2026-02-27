/**
 * SIMRS ZEN - Role-Based Access Control Middleware
 * Implements RBAC matching the original 21-role system
 */

/**
 * Available Roles (matching app_role enum)
 */
export const ROLES = {
  ADMIN: 'admin',
  DOKTER: 'dokter',
  PERAWAT: 'perawat',
  FARMASI: 'farmasi',
  LABORATORIUM: 'laboratorium',
  RADIOLOGI: 'radiologi',
  PENDAFTARAN: 'pendaftaran',
  KASIR: 'kasir',
  KEUANGAN: 'keuangan',
  HRD: 'hrd',
  MANAJEMEN: 'manajemen',
  REKAM_MEDIS: 'rekam_medis',
  GIZI: 'gizi',
  REHABILITASI: 'rehabilitasi',
  BEDAH: 'bedah',
  ICU: 'icu',
  HEMODIALISA: 'hemodialisa',
  FORENSIK: 'forensik',
  PROCUREMENT: 'procurement',
  IT: 'it',
  GUEST: 'guest'
};

/**
 * Check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autentikasi diperlukan',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = req.user.roles || [];
    
    // Admin has access to everything
    if (userRoles.includes(ROLES.ADMIN)) {
      return next();
    }

    // Check if user has any of the allowed roles
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses ke resource ini',
        code: 'FORBIDDEN',
        requiredRoles: roles,
        userRoles: userRoles
      });
    }

    next();
  };
};

/**
 * Check if user has ALL required roles
 */
export const requireAllRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autentikasi diperlukan'
      });
    }

    const userRoles = req.user.roles || [];

    // Admin bypass
    if (userRoles.includes(ROLES.ADMIN)) {
      return next();
    }

    const hasAllRoles = requiredRoles.every(role => userRoles.includes(role));

    if (!hasAllRoles) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki semua role yang diperlukan',
        code: 'INSUFFICIENT_ROLES'
      });
    }

    next();
  };
};

/**
 * Check menu access based on user roles
 */
export const checkMenuAccess = (menuPath, action = 'view') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autentikasi diperlukan'
      });
    }

    const userRoles = req.user.roles || [];

    // Admin bypass
    if (userRoles.includes(ROLES.ADMIN)) {
      return next();
    }

    try {
      // Check menu_access table
      const { prisma } = await import('../config/database.js');
      
      const access = await prisma.menu_access.findFirst({
        where: {
          menu_path: menuPath,
          role: { in: userRoles },
          [`can_${action}`]: true
        }
      });

      if (!access) {
        return res.status(403).json({
          success: false,
          error: `Anda tidak memiliki akses ${action} untuk menu ini`,
          code: 'MENU_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Menu access check error:', error);
      next(error);
    }
  };
};

/**
 * Role hierarchy for department-specific access
 */
export const DEPARTMENT_ROLES = {
  clinical: [ROLES.DOKTER, ROLES.PERAWAT, ROLES.BEDAH, ROLES.ICU],
  pharmacy: [ROLES.FARMASI],
  laboratory: [ROLES.LABORATORIUM],
  radiology: [ROLES.RADIOLOGI],
  finance: [ROLES.KASIR, ROLES.KEUANGAN],
  hr: [ROLES.HRD],
  management: [ROLES.MANAJEMEN, ROLES.ADMIN],
  registration: [ROLES.PENDAFTARAN, ROLES.REKAM_MEDIS],
  support: [ROLES.GIZI, ROLES.REHABILITASI, ROLES.HEMODIALISA, ROLES.FORENSIK]
};

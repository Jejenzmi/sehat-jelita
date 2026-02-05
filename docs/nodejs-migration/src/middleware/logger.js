/**
 * SIMRS ZEN - Request Logger Middleware
 * Structured logging for all HTTP requests
 */

/**
 * Request Logger - logs all incoming requests
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Generate request ID
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log request
  const requestLog = {
    id: req.requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length ? req.query : undefined,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`→ ${req.method} ${req.path}`, requestLog);
  }

  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    const responseLog = {
      id: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      console.error(`← ${res.statusCode} ${req.method} ${req.path} [${duration}ms]`, responseLog);
    } else if (res.statusCode >= 400) {
      console.warn(`← ${res.statusCode} ${req.method} ${req.path} [${duration}ms]`, responseLog);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`← ${res.statusCode} ${req.method} ${req.path} [${duration}ms]`);
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Error Logger - detailed error logging
 */
export const errorLogger = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    body: req.body,
    user: req.user?.id
  });

  next(err);
};

/**
 * Audit Logger - logs data changes
 */
export const auditLog = async (prisma, {
  tableName,
  action,
  recordId,
  userId,
  oldData,
  newData,
  req
}) => {
  try {
    await prisma.audit_logs.create({
      data: {
        table_name: tableName,
        action,
        record_id: recordId,
        user_id: userId,
        old_data: oldData,
        new_data: newData,
        ip_address: req?.ip,
        user_agent: req?.get('User-Agent')
      }
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};

export default requestLogger;

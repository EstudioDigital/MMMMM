export function logSecurityEvent(type, data, request) {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    ip: request?.ip,
    userAgent: request?.headers?.['user-agent'],
    ...data,
  }
  console.log(`[SECURITY] ${JSON.stringify(event)}`)
}
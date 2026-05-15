export async function verifyJWT(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Token inválido o expirado' })
  }
}
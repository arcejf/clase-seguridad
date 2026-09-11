# Rate Limiting

## ¿Qué es?

El **rate limit** es un mecanismo que limita solicitudes por IP/cliente en un período de tiempo. Protege contra:
- Ataques de fuerza bruta (múltiples intentos de contraseña)
- Abuso de API (scraping, spam)
- Sobrecarga del servidor (DoS)

## ¿Cómo funciona?

Express-rate-limit:
1. Guarda la IP del cliente + timestamp en un store (RAM o Redis)
2. Cuenta cuántos requests hizo la IP en la ventana de tiempo (windowMs)
3. Si supera el límite → HTTP 429 Too Many Requests
4. Si no → continúa normalmente
5. Devuelve headers `RateLimit-*` informando requests restantes

## Limitaciones

Un atacante con suficientes recursos podría evadir el límite usando:
- **Botnet**: Múltiples computadoras infectadas (cada una = IP diferente)
- **Múltiples VPNs**: Cambiar de servidor VPN en cada intento

**Pero sigue siendo efectivo:**
- Atacante típico (1 VPN) → bloqueado en 5 intentos
- Para evadir necesita cientos de VPNs (muy costoso y lento)
- Múltiples IPs en poco tiempo es detectable

## Relación con `trust proxy`

En producción (Render, Railway, etc) hay proxies entre cliente y Express.

**Sin `trust proxy`:**
- Express ve: IP del proxy (siempre igual)
- Rate limit cree todos son 1 sola IP
- Bloquea usuarios legítimos ❌

**Con `app.set('trust proxy', 1)`:**
- Express lee header `X-Forwarded-For`
- Ve la IP real de cada cliente
- Cada cliente tiene contador independiente ✅

**Nota:** Si varios clientes usan la misma VPN, comparten contador (limitación del rate limit por IP).

## Buenas prácticas

1. **Límites diferenciados**: Endpoints sensibles (`/auth/login`) más restrictivos que públicos
2. **Usa tokens**: Preferir JWT/API Key sobre IP cuando sea posible
3. **Usa HTTP 429**: Código estándar cuando se supera límite
4. **Informa al usuario**: Headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
5. **Defensas adicionales**: MFA, bloqueo temporal, bcrypt, monitoreo de actividad sospechosa
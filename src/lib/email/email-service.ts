import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY no está configurado')
}

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL =
  process.env.EMAIL_FROM || 'Prode Mundial 2026 <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envía email de verificación de cuenta
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name: string
): Promise<EmailResponse> {
  try {
    const verificationUrl = `${APP_URL}/api/auth/verify?token=${token}`

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🎉 Verificá tu cuenta - Prode Mundial 2026',
      html: getVerificationEmailTemplate(name, verificationUrl),
      text: getVerificationEmailText(name, verificationUrl),
    })

    if (error) {
      console.error('Error enviando email de verificación:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email de verificación enviado:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error inesperado al enviar email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Envía email de recuperación de contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string
): Promise<EmailResponse> {
  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🔐 Recuperá tu contraseña - Prode Mundial 2026',
      html: getPasswordResetEmailTemplate(name, resetUrl),
      text: getPasswordResetEmailText(name, resetUrl),
    })

    if (error) {
      console.error('Error enviando email de reset:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email de reset enviado:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error inesperado al enviar email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Envía email de bienvenida (opcional)
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<EmailResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '⚽ Bienvenido a Prode Mundial 2026',
      html: getWelcomeEmailTemplate(name),
      text: getWelcomeEmailText(name),
    })

    if (error) {
      console.error('Error enviando email de bienvenida:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email de bienvenida enviado:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error inesperado al enviar email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

// ============================================
// TEMPLATES HTML
// ============================================

function getVerificationEmailTemplate(
  name: string,
  verificationUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificá tu cuenta</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ⚽ Prode Mundial 2026
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">
                ¡Hola ${name}! 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en <strong>Prode Mundial 2026</strong>. Estás a un paso de comenzar a hacer tus predicciones.
              </p>
              
              <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.6;">
                Para verificar tu cuenta, hacé click en el siguiente botón:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Verificar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copiá y pegá este link en tu navegador:<br>
                <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Este link expira en <strong>24 horas</strong>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 14px;">
                <strong>Prode Mundial 2026</strong>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                Si no te registraste en nuestra plataforma, ignorá este email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperá tu contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🔐 Prode Mundial 2026
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">
                Hola ${name},
              </h2>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              </p>
              
              <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.6;">
                Hacé click en el siguiente botón para crear una nueva contraseña:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copiá y pegá este link en tu navegador:<br>
                <a href="${resetUrl}" style="color: #f5576c; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Este link expira en <strong>1 hora</strong>.
              </p>
              
              <p style="margin: 30px 0 0; color: #d9534f; font-size: 14px; line-height: 1.6; background-color: #fff5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #d9534f;">
                <strong>⚠️ Importante:</strong> Si no solicitaste restablecer tu contraseña, ignorá este email y tu contraseña permanecerá sin cambios.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 14px;">
                <strong>Prode Mundial 2026</strong>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                Por tu seguridad, nunca compartas este email con nadie.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function getWelcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ⚽ ¡Bienvenido!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">
                ¡Hola ${name}! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Tu cuenta ha sido verificada exitosamente. ¡Estás listo para comenzar!
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Ahora podés:
              </p>
              
              <ul style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                <li>Hacer tus predicciones para el Mundial 2026</li>
                <li>Competir con tus amigos</li>
                <li>Ver la tabla de posiciones</li>
                <li>Ganar puntos y premios</li>
              </ul>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);">
                      Ir a mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 14px;">
                <strong>Prode Mundial 2026</strong>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                ¡Que disfrutes haciendo tus predicciones!
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// ============================================
// TEMPLATES TEXTO PLANO
// ============================================

function getVerificationEmailText(
  name: string,
  verificationUrl: string
): string {
  return `
Hola ${name}!

Gracias por registrarte en Prode Mundial 2026.

Para verificar tu cuenta, visitá el siguiente link:
${verificationUrl}

Este link expira en 24 horas.

Si no te registraste en nuestra plataforma, ignorá este email.

---
Prode Mundial 2026
  `.trim()
}

function getPasswordResetEmailText(name: string, resetUrl: string): string {
  return `
Hola ${name},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, visitá el siguiente link:
${resetUrl}

Este link expira en 1 hora.

Si no solicitaste restablecer tu contraseña, ignorá este email y tu contraseña permanecerá sin cambios.

---
Prode Mundial 2026
  `.trim()
}

function getWelcomeEmailText(name: string): string {
  return `
¡Hola ${name}!

Tu cuenta ha sido verificada exitosamente. ¡Estás listo para comenzar!

Ahora podés:
- Hacer tus predicciones para el Mundial 2026
- Competir con tus amigos
- Ver la tabla de posiciones
- Ganar puntos y premios

Visitá ${APP_URL} para comenzar.

---
Prode Mundial 2026
  `.trim()
}

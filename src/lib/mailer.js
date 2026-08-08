import nodemailer from 'nodemailer'

/**
 * Envio de e-mail é opcional. Se as variáveis SMTP_* não estiverem no
 * .env.local, `isMailConfigured()` retorna false e o app cai no modo
 * de desenvolvimento (mostra o link de redefinição na própria tela).
 *
 * Exemplo de configuração com Gmail (use uma "Senha de app", não a
 * senha da conta):
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=voce@gmail.com
 *   SMTP_PASS=xxxxxxxxxxxxxxxx
 *   MAIL_FROM="Burger House <voce@gmail.com>"
 */
export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

export async function sendResetEmail({ to, name, resetUrl, shopName }) {
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f5;padding:32px">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;
                  box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:#111;padding:24px;text-align:center">
          <span style="font-size:28px">🍔</span>
          <div style="color:#fff;font-size:18px;font-weight:700;margin-top:8px">${shopName}</div>
        </div>
        <div style="padding:32px 28px;color:#18181b;line-height:1.6">
          <h1 style="margin:0 0 16px;font-size:20px">Redefinir sua senha</h1>
          <p style="margin:0 0 12px">Olá, ${name || 'tudo bem'}!</p>
          <p style="margin:0 0 24px">
            Recebemos um pedido para redefinir a senha da sua conta.
            Clique no botão abaixo para criar uma nova senha. O link expira em 30 minutos.
          </p>
          <a href="${resetUrl}"
             style="display:block;background:#ff6b1a;color:#fff;text-decoration:none;text-align:center;
                    padding:14px 20px;border-radius:12px;font-weight:700">
            Criar nova senha
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#71717a">
            Se você não pediu isso, ignore este e-mail — sua senha atual continua valendo.
          </p>
        </div>
      </div>
    </div>`

  await transporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `${shopName} — redefinir sua senha`,
    html,
    text: `Redefinir sua senha: ${resetUrl} (o link expira em 30 minutos)`,
  })
}

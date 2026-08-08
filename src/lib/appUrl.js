/**
 * Endereço público da loja, para links que o servidor gera e manda para fora
 * (hoje, o e-mail de recuperação de senha).
 *
 * Precisa vir de configuração, nunca da requisição. `Origin` e `Host` são
 * escolhidos por quem chama: um POST em /api/auth/forgot com
 * `Origin: https://site-do-atacante.com` faria o e-mail de recuperação — que
 * sai do seu domínio, com o seu texto — carregar um link de redefinição
 * apontando para o servidor do atacante. Quem clicasse entregaria o token,
 * e com ele a conta.
 */
export function appUrl() {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured

  // Em produção preferimos falhar a mandar um link errado: sem APP_URL o
  // /api/auth/forgot responde 500 e o e-mail não sai.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_URL não definida no ambiente — necessária para o link de recuperação.')
  }

  return 'http://localhost:3000'
}

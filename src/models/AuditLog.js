import mongoose from 'mongoose'

/**
 * Trilha de auditoria dos eventos sensíveis: entrada de admin, mudança de
 * status de pedido, troca de senha, recusa por excesso de tentativas.
 *
 * Existe porque `console.log` não sobrevive a um deploy. Se um dia houver
 * dúvida sobre quem marcou um pedido como entregue, ou se alguém entrou no
 * painel de madrugada, a resposta precisa estar gravada em algum lugar.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Ex.: 'login.admin', 'order.status_changed', 'password.changed'
    action: { type: String, required: true, index: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    // Cópia do e-mail no momento do evento: se a conta for apagada depois,
    // a linha do log continua dizendo de quem se tratava.
    userEmail: { type: String, default: '' },

    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderCode: { type: Number, default: null },

    ip: { type: String, default: '' },
    detail: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'auditlogs' }
)

/**
 * Retenção de 180 dias.
 *
 * Sem isto a coleção cresceria para sempre — e como ela registra também as
 * tentativas de entrada que falharam, quem estivesse atacando o login estaria
 * de quebra enchendo o seu banco. Meio ano cobre qualquer conferência real.
 */
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 })

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)

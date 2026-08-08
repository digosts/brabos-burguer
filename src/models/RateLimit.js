import mongoose from 'mongoose'

/**
 * Contador de requisições por chave, usado pelo limitador de frequência.
 *
 * Fica no Mongo em vez de na memória do processo porque em produção o app roda
 * em várias instâncias (e elas reiniciam a frio): um contador em memória seria
 * zerado a cada requisição que caísse em outra instância, o que na prática
 * significa nenhum limite.
 *
 * O índice TTL apaga os documentos sozinho quando a janela passa — não há
 * rotina de limpeza para manter.
 */
const rateLimitSchema = new mongoose.Schema(
  {
    // A fatia de tempo faz parte da chave — ver `rateLimit`.
    // Ex.: "order:ip:189.4.x.x:2941123", "login:email:fulano@site.com:196074"
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { collection: 'ratelimits' }
)

// `expireAfterSeconds: 0` = apagar assim que `resetAt` ficar no passado.
// O Mongo varre a cada ~60s, então o documento pode sobreviver um pouco à
// própria janela; por isso o código também compara `resetAt` com o relógio,
// em vez de confiar na ausência do documento.
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema)

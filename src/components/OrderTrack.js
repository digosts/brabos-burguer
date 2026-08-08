import { IconBag, IconCheck, IconFlame, IconTruck } from './Icons'

const STEPS = [
  { label: 'Recebido', Icon: IconBag },
  { label: 'Em preparação', Icon: IconFlame },
  { label: 'Saiu p/ entrega', Icon: IconTruck },
  { label: 'Entregue', Icon: IconCheck },
]

/** Trilha de etapas do pedido — a mesma para quem tem conta e para quem não tem. */
export default function OrderTrack({ step }) {
  return (
    <div className="track" aria-label={`Etapa ${step + 1} de ${STEPS.length}`}>
      {STEPS.map(({ label, Icon }, i) => (
        <div key={label} style={{ display: 'contents' }}>
          {i > 0 ? <span className={`track-bar${i <= step ? ' done' : ''}`} /> : null}
          <div className={`track-step${i <= step ? ' done' : ''}`}>
            <i>
              <Icon size={15} />
            </i>
            <span>{label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

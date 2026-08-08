/**
 * Gera os ícones PNG do PWA sem nenhuma dependência externa.
 *
 *   npm run icons
 *
 * O Android/Chrome exige ícones raster (PNG) de 192px e 512px para
 * oferecer a instalação, então desenhamos os pixels na mão e
 * codificamos o PNG com o zlib que já vem no Node.
 *
 * Quer trocar pela sua logo? Basta substituir os arquivos em
 * public/icons/ mantendo os mesmos nomes e tamanhos.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'icons')

// ─────────────────────────── codificador PNG ───────────────────────────

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

/** rgba: Buffer com size*size*4 bytes. */
function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // filtro adaptativo
  ihdr[12] = 0 // sem entrelaçamento

  // Cada linha do PNG começa com o byte do filtro (0 = nenhum).
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ──────────────────────────── desenho do ícone ────────────────────────────

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

const C = {
  bgTop: hex('#FF9838'),
  bgBottom: hex('#EF4E06'),
  plate: hex('#FFF6E9'),
  bunTop: hex('#F2A950'),
  bunTopLight: hex('#FFC375'),
  bunBottom: hex('#E0913A'),
  sesame: hex('#FFF3DC'),
  lettuce: hex('#5FB53B'),
  cheese: hex('#FFC531'),
  patty: hex('#6B3A1E'),
}

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

const inEllipse = (x, y, cx, cy, rx, ry) => {
  const dx = (x - cx) / rx
  const dy = (y - cy) / ry
  return dx * dx + dy * dy <= 1
}

function inRoundedRect(x, y, halfW, top, bottom, r) {
  if (Math.abs(x) > halfW || y < top || y > bottom) return false
  const ix = Math.abs(x) - (halfW - r)
  const iyTop = top + r - y
  const iyBottom = y - (bottom - r)
  if (ix <= 0) return true
  if (iyTop > 0) return ix * ix + iyTop * iyTop <= r * r
  if (iyBottom > 0) return ix * ix + iyBottom * iyBottom <= r * r
  return true
}

/** Máscara arredondada do fundo (cantos transparentes) — usada nos ícones "any". */
function inRoundedSquare(x, y, radius) {
  return inRoundedRect(x - 0.5, y, 0.5, 0, 1, radius)
}

const SESAME = [
  [0, 0.1],
  [-0.24, 0.15],
  [0.24, 0.15],
  [-0.12, 0.24],
  [0.12, 0.24],
  [-0.37, 0.26],
  [0.37, 0.26],
]

/**
 * Cor de um ponto do ícone. x,y ∈ [0,1].
 * Retorna [r,g,b,a]; a=0 significa transparente.
 */
function sample(x, y, opt) {
  if (!opt.fullBleed && !inRoundedSquare(x, y, 0.22)) return [0, 0, 0, 0]

  // Fundo: gradiente na diagonal, dá mais profundidade que o vertical puro.
  let color = mix(C.bgTop, C.bgBottom, Math.min(1, (x * 0.35 + y * 0.9) / 1.15))

  // Prato claro atrás do hambúrguer, para destacar do laranja.
  if (inEllipse(x, y, 0.5, 0.5, opt.plateR, opt.plateR)) color = C.plate

  // Coordenadas locais do hambúrguer: lx ∈ [-0.5,0.5], ly ∈ [0,1].
  const bw = opt.burgerW
  const bh = bw * 0.88
  const lx = (x - 0.5) / bw
  const ly = (y - (0.5 - bh / 2)) / bh

  if (lx >= -0.55 && lx <= 0.55 && ly >= -0.05 && ly <= 1.05) {
    // Pão de baixo — retângulo com a base arredondada.
    if (
      inRoundedRect(lx, ly, 0.46, 0.7, 0.88, 0.02) ||
      (ly >= 0.88 && inEllipse(lx, ly, 0, 0.88, 0.46, 0.12))
    ) {
      color = C.bunBottom
    }

    // Hambúrguer.
    if (inRoundedRect(lx, ly, 0.45, 0.55, 0.7, 0.035)) color = C.patty

    // Queijo, com três pingos escorrendo.
    const drip =
      inEllipse(lx, ly, -0.3, 0.55, 0.075, 0.1) ||
      inEllipse(lx, ly, 0, 0.55, 0.075, 0.12) ||
      inEllipse(lx, ly, 0.3, 0.55, 0.075, 0.1)
    if (inRoundedRect(lx, ly, 0.47, 0.47, 0.55, 0.02) || (ly >= 0.55 && drip)) {
      color = C.cheese
    }

    // Alface, com a borda de baixo ondulada.
    const lettuceBottom = 0.47 + 0.02 * Math.sin(lx * Math.PI * 6)
    if (Math.abs(lx) <= 0.5 && ly >= 0.4 && ly <= lettuceBottom) color = C.lettuce

    // Pão de cima: cúpula + base reta, com brilho no topo.
    const dome = ly <= 0.36 && inEllipse(lx, ly, 0, 0.36, 0.5, 0.36)
    const domeBase = ly > 0.36 && ly <= 0.4 && Math.abs(lx) <= 0.5
    if (dome || domeBase) {
      color = dome ? mix(C.bunTopLight, C.bunTop, Math.min(1, ly / 0.36)) : C.bunTop
      for (const [sx, sy] of SESAME) {
        if (inEllipse(lx, ly, sx, sy, 0.052, 0.032)) {
          color = C.sesame
          break
        }
      }
    }
  }

  return [color[0], color[1], color[2], 255]
}

/** Renderiza com supersampling para as bordas saírem suaves (antialiasing). */
function render(size, opt) {
  const SS = 4
  const buf = Buffer.alloc(size * size * 4)

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [sr, sg, sb, sa] = sample(
            (px + (sx + 0.5) / SS) / size,
            (py + (sy + 0.5) / SS) / size,
            opt
          )
          const alpha = sa / 255
          // Acumula com alpha pré-multiplicado, senão as bordas escurecem.
          r += sr * alpha
          g += sg * alpha
          b += sb * alpha
          a += alpha
        }
      }

      const total = SS * SS
      const i = (py * size + px) * 4
      if (a > 0) {
        buf[i] = Math.round(r / a)
        buf[i + 1] = Math.round(g / a)
        buf[i + 2] = Math.round(b / a)
        buf[i + 3] = Math.round((a / total) * 255)
      }
    }
  }

  return buf
}

// ──────────────────────────────── saída ────────────────────────────────

const ANY = { fullBleed: false, plateR: 0.4, burgerW: 0.6 }
// O maskable é recortado pelo sistema: o desenho fica na área segura (80% central).
const MASKABLE = { fullBleed: true, plateR: 0.33, burgerW: 0.49 }

const TARGETS = [
  { file: 'icon-192.png', size: 192, opt: ANY },
  { file: 'icon-512.png', size: 512, opt: ANY },
  { file: 'icon-maskable-192.png', size: 192, opt: MASKABLE },
  { file: 'icon-maskable-512.png', size: 512, opt: MASKABLE },
  // O iOS não aceita transparência no apple-touch-icon e aplica a máscara sozinho.
  { file: 'apple-touch-icon.png', size: 180, opt: { ...ANY, fullBleed: true } },
]

mkdirSync(OUT_DIR, { recursive: true })

for (const { file, size, opt } of TARGETS) {
  const png = encodePng(render(size, opt), size)
  writeFileSync(join(OUT_DIR, file), png)
  console.log(`✓ public/icons/${file}  (${size}x${size}, ${(png.length / 1024).toFixed(1)} kB)`)
}

// O Next usa src/app/icon.png automaticamente como favicon.
writeFileSync(join(ROOT, 'src', 'app', 'icon.png'), encodePng(render(64, ANY), 64))
console.log('✓ src/app/icon.png  (favicon 64x64)')

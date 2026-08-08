/**
 * Gera os ícones PNG do PWA a partir de assets/logo.png,
 * sem nenhuma dependência externa.
 *
 *   npm run icons
 *
 * A logo é composta sobre o mesmo gradiente laranja da marca. Para trocar
 * a logo, substitua assets/logo.png (PNG RGBA, de preferência quadrado e
 * com fundo transparente) e rode o comando de novo.
 *
 * O Node só traz o zlib, então o decodificador e o codificador de PNG
 * estão escritos aqui na mão — o suficiente para PNG de 8 bits sem
 * entrelaçamento, que é o que as ferramentas de recorte costumam gerar.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync, inflateSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'icons')
const LOGO = join(ROOT, 'assets', 'logo.png')

// ─────────────────────────── PNG: comum ───────────────────────────

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

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

// ─────────────────────────── PNG: codificador ───────────────────────────

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
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ─────────────────────────── PNG: decodificador ───────────────────────────

const paeth = (a, b, c) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

/** Desfaz os filtros por linha e devolve os bytes crus da imagem. */
function unfilter(data, width, height, channels) {
  const stride = width * channels
  const out = Buffer.alloc(stride * height)

  for (let y = 0; y < height; y++) {
    const filter = data[y * (stride + 1)]
    const line = y * (stride + 1) + 1
    const prev = (y - 1) * stride
    const cur = y * stride

    for (let i = 0; i < stride; i++) {
      const raw = data[line + i]
      const a = i >= channels ? out[cur + i - channels] : 0
      const b = y > 0 ? out[prev + i] : 0
      const c = y > 0 && i >= channels ? out[prev + i - channels] : 0

      let value
      switch (filter) {
        case 0:
          value = raw
          break
        case 1:
          value = raw + a
          break
        case 2:
          value = raw + b
          break
        case 3:
          value = raw + ((a + b) >> 1)
          break
        case 4:
          value = raw + paeth(a, b, c)
          break
        default:
          throw new Error(`Filtro PNG desconhecido na linha ${y}: ${filter}`)
      }
      out[cur + i] = value & 0xff
    }
  }

  return out
}

/** Lê um PNG de 8 bits (RGBA, RGB, cinza ou paleta) e devolve RGBA. */
function decodePng(buffer) {
  if (!buffer.slice(0, 8).equals(SIGNATURE)) throw new Error('Arquivo não é um PNG.')

  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  let palette = null
  let transparency = null
  const idat = []

  let off = 8
  while (off < buffer.length) {
    const len = buffer.readUInt32BE(off)
    const type = buffer.slice(off + 4, off + 8).toString('ascii')
    const data = buffer.slice(off + 8, off + 8 + len)

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    } else if (type === 'PLTE') {
      palette = data
    } else if (type === 'tRNS') {
      transparency = data
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }

    off += 12 + len
  }

  if (bitDepth !== 8) throw new Error(`PNG de ${bitDepth} bits não suportado — use 8 bits por canal.`)
  if (interlace !== 0) throw new Error('PNG entrelaçado (Adam7) não suportado — salve sem entrelaçamento.')

  const channelsByType = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }
  const channels = channelsByType[colorType]
  if (!channels) throw new Error(`Tipo de cor PNG não suportado: ${colorType}`)

  const raw = unfilter(inflateSync(Buffer.concat(idat)), width, height, channels)
  const rgba = Buffer.alloc(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    const s = i * channels
    const d = i * 4
    switch (colorType) {
      case 0: // cinza
        rgba[d] = rgba[d + 1] = rgba[d + 2] = raw[s]
        rgba[d + 3] = 255
        break
      case 2: // RGB
        rgba[d] = raw[s]
        rgba[d + 1] = raw[s + 1]
        rgba[d + 2] = raw[s + 2]
        rgba[d + 3] = 255
        break
      case 3: {
        // paleta
        const p = raw[s] * 3
        rgba[d] = palette[p]
        rgba[d + 1] = palette[p + 1]
        rgba[d + 2] = palette[p + 2]
        rgba[d + 3] = transparency && raw[s] < transparency.length ? transparency[raw[s]] : 255
        break
      }
      case 4: // cinza + alfa
        rgba[d] = rgba[d + 1] = rgba[d + 2] = raw[s]
        rgba[d + 3] = raw[s + 1]
        break
      default: // RGBA
        rgba[d] = raw[s]
        rgba[d + 1] = raw[s + 1]
        rgba[d + 2] = raw[s + 2]
        rgba[d + 3] = raw[s + 3]
    }
  }

  return { data: rgba, width, height }
}

// ─────────────────────────── tratamento da logo ───────────────────────────

/** Recorta a moldura transparente para a logo ocupar o ícone inteiro. */
function trim(img, threshold = 8) {
  let top = img.height
  let left = img.width
  let right = -1
  let bottom = -1

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] <= threshold) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }

  if (right < left || bottom < top) throw new Error('A logo está totalmente transparente.')

  const width = right - left + 1
  const height = bottom - top + 1
  const data = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    img.data.copy(
      data,
      y * width * 4,
      ((y + top) * img.width + left) * 4,
      ((y + top) * img.width + left + width) * 4
    )
  }

  return { data, width, height }
}

/**
 * Redimensiona pela média da área de origem (box filter). O alfa entra
 * pré-multiplicado, senão os pixels transparentes das bordas puxam a cor
 * do recorte para dentro do desenho.
 */
function resize(img, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4)
  const sx = img.width / dw
  const sy = img.height / dh

  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * sy)
    const y1 = Math.max(y0 + 1, Math.ceil((y + 1) * sy))

    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * sx)
      const x1 = Math.max(x0 + 1, Math.ceil((x + 1) * sx))

      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let n = 0

      for (let iy = y0; iy < Math.min(y1, img.height); iy++) {
        for (let ix = x0; ix < Math.min(x1, img.width); ix++) {
          const i = (iy * img.width + ix) * 4
          const alpha = img.data[i + 3] / 255
          r += img.data[i] * alpha
          g += img.data[i + 1] * alpha
          b += img.data[i + 2] * alpha
          a += alpha
          n++
        }
      }

      const d = (y * dw + x) * 4
      if (a > 0) {
        out[d] = Math.round(r / a)
        out[d + 1] = Math.round(g / a)
        out[d + 2] = Math.round(b / a)
        out[d + 3] = Math.round((a / n) * 255)
      }
    }
  }

  return { data: out, width: dw, height: dh }
}

// ─────────────────────────── desenho do ícone ───────────────────────────

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

// Mesmo laranja da marca usado desde a primeira versão do ícone.
const C = {
  bgTop: hex('#FF9838'),
  bgBottom: hex('#EF4E06'),
}

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

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

/** Fundo laranja com supersampling só nas bordas arredondadas. */
function renderBackground(size, fullBleed) {
  const SS = 4
  const buf = Buffer.alloc(size * size * 4)

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let inside = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size
          const y = (py + (sy + 0.5) / SS) / size
          if (fullBleed || inRoundedSquare(x, y, 0.22)) inside++
        }
      }

      const i = (py * size + px) * 4
      if (inside === 0) continue

      const x = (px + 0.5) / size
      const y = (py + 0.5) / size
      // Gradiente na diagonal: dá mais profundidade que o vertical puro.
      const color = mix(C.bgTop, C.bgBottom, Math.min(1, (x * 0.35 + y * 0.9) / 1.15))
      buf[i] = color[0]
      buf[i + 1] = color[1]
      buf[i + 2] = color[2]
      buf[i + 3] = Math.round((inside / (SS * SS)) * 255)
    }
  }

  return buf
}

/** Compõe a logo centralizada sobre o fundo (source-over). */
function compose(bg, size, logo, scale) {
  const box = Math.round(size * scale)
  const ratio = Math.min(box / logo.width, box / logo.height)
  const w = Math.max(1, Math.round(logo.width * ratio))
  const h = Math.max(1, Math.round(logo.height * ratio))
  const small = resize(logo, w, h)

  const offX = Math.round((size - w) / 2)
  const offY = Math.round((size - h) / 2)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4
      const sa = small.data[s + 3] / 255
      if (sa === 0) continue

      const d = ((y + offY) * size + (x + offX)) * 4
      // Fora da máscara arredondada não se desenha nada: manter o alfa do
      // fundo recorta a logo no mesmo contorno do ícone, sem vazar nos cantos.
      if (bg[d + 3] === 0) continue

      for (let c = 0; c < 3; c++) {
        bg[d + c] = Math.round(small.data[s + c] * sa + bg[d + c] * (1 - sa))
      }
    }
  }

  return bg
}

function render(size, opt, logo) {
  return compose(renderBackground(size, opt.fullBleed), size, logo, opt.scale)
}

// ──────────────────────────────── saída ────────────────────────────────

const source = trim(decodePng(readFileSync(LOGO)))
console.log(`→ assets/logo.png recortada para ${source.width}x${source.height}`)

const ANY = { fullBleed: false, scale: 0.9 }
// O maskable é recortado pelo sistema: o desenho fica na área segura (80% central).
const MASKABLE = { fullBleed: true, scale: 0.68 }

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
  const png = encodePng(render(size, opt, source), size)
  writeFileSync(join(OUT_DIR, file), png)
  console.log(`✓ public/icons/${file}  (${size}x${size}, ${(png.length / 1024).toFixed(1)} kB)`)
}

// O Next usa src/app/icon.png automaticamente como favicon.
writeFileSync(join(ROOT, 'src', 'app', 'icon.png'), encodePng(render(64, ANY, source), 64))
console.log('✓ src/app/icon.png  (favicon 64x64)')

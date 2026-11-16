import { useEffect, useMemo, useRef, useState } from 'react'

const COLORS = [
  ['#f7a8be', '#e86f93'],
  ['#fbc6d4', '#f08aa8'],
  ['#ffd9c2', '#f2a07b'],
  ['#f5b8c8', '#d9567e'],
  ['#f3d27f', '#c9963f'],
]

function makePetal(x, y, burst) {
  const c = COLORS[(Math.random() * COLORS.length) | 0]
  const a = Math.random() * Math.PI * 2
  const sp = burst ? 2 + Math.random() * 4 : 0
  return {
    x,
    y,
    vx: burst ? Math.cos(a) * sp : (Math.random() - 0.5) * 0.4,
    vy: burst ? Math.sin(a) * sp - 2 : 0.5 + Math.random() * 0.8,
    r: 5 + Math.random() * 7,
    rot: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * 0.06,
    flip: Math.random() * 6.28,
    vf: 0.03 + Math.random() * 0.05,
    sway: Math.random() * 6.28,
    c,
    life: burst ? 1 : 2,
    burst,
  }
}

function computeCountdown(nowMs, targetMs) {
  const ms = targetMs - nowMs
  if (ms <= 0) {
    return {
      live: false,
      line: ms > -6 * 3600e3 ? 'The celebration is happening now' : 'Thank you for celebrating with us',
    }
  }
  const s = Math.floor(ms / 1000)
  return {
    live: true,
    d: Math.floor(s / 86400),
    h: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
    m: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
    s: String(s % 60).padStart(2, '0'),
    line: 'Counting down to our day',
  }
}

export default function Invitation({ side }) {
  const targetMs = useMemo(() => Date.parse(side.targetISO), [side.targetISO])
  const [opened, setOpened] = useState(false)
  const [doorsGone, setDoorsGone] = useState(false)
  const [count, setCount] = useState(() => computeCountdown(Date.now(), targetMs))

  const canvasRef = useRef(null)
  const cardRef = useRef(null)
  const jhLRef = useRef(null)
  const jhRRef = useRef(null)
  const petalsRef = useRef([])
  const ambientRef = useRef(false)
  const openedRef = useRef(false)
  const burstRef = useRef(() => {})
  const audioCtxRef = useRef(null)

  // ---------- petals canvas ----------
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    let W = 0
    let H = 0
    let dpr = 1
    let rafId = 0
    let last = performance.now()

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      cv.width = W * dpr
      cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    const draw = (p) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.8 + 0.2)
      const g = ctx.createLinearGradient(0, -p.r, 0, p.r)
      g.addColorStop(0, p.c[0])
      g.addColorStop(1, p.c[1])
      ctx.fillStyle = g
      ctx.globalAlpha = Math.min(1, p.life) * 0.92
      ctx.beginPath()
      ctx.moveTo(0, -p.r)
      ctx.bezierCurveTo(p.r * 0.9, -p.r * 0.6, p.r * 0.7, p.r * 0.7, 0, p.r)
      ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.7, -p.r * 0.9, -p.r * 0.6, 0, -p.r)
      ctx.fill()
      ctx.restore()
    }

    const tick = (t) => {
      const dt = Math.min(3, (t - last) / 16.67)
      last = t
      ctx.clearRect(0, 0, W, H)
      const arr = petalsRef.current
      if (
        ambientRef.current &&
        !reduce &&
        arr.filter((p) => !p.burst).length < Math.min(34, W / 18) &&
        Math.random() < 0.12 * dt
      ) {
        arr.push(makePetal(Math.random() * W, -20, false))
      }
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i]
        p.sway += 0.02 * dt
        if (p.burst) {
          p.vx *= 0.97
          p.vy = p.vy * 0.97 + 0.06 * dt
          if (p.vy > 1.4) p.vy = 1.4
          p.life -= 0.004 * dt
        }
        p.x += (p.vx + Math.sin(p.sway) * 0.5) * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        p.flip += p.vf * dt
        if (p.y > H + 30 || p.life <= 0) {
          arr.splice(i, 1)
          continue
        }
        draw(p)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    burstRef.current = (x, y, n) => {
      for (let i = 0; i < n; i++) petalsRef.current.push(makePetal(x, y, true))
    }

    const onPointerDown = (e) => {
      if (!openedRef.current) return
      if (e.target && e.target.closest && e.target.closest('a')) return
      burstRef.current(e.clientX, e.clientY, reduce ? 6 : 18)
    }
    document.addEventListener('pointerdown', onPointerDown)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', size)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  // ---------- card tilt + lantern tap ----------
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const card = cardRef.current
    if (!card) return

    const onMove = (e) => {
      if (reduce) return
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg')
      card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg')
      card.style.setProperty('--gx', x * 100 + '%')
      card.style.setProperty('--gy', y * 100 + '%')
      card.style.setProperty('--go', 1)
    }
    const onLeave = () => {
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
      card.style.setProperty('--go', 0)
    }
    const onClick = (e) => {
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      if (y < 0.27 && x < 0.21) {
        const j = x < 0.112 ? jhLRef.current : jhRRef.current
        if (j) {
          j.classList.remove('jingle')
          // force reflow so the animation restarts
          void j.offsetWidth
          j.classList.add('jingle')
        }
        chime()
      }
    }
    card.addEventListener('pointermove', onMove)
    card.addEventListener('pointerleave', onLeave)
    card.addEventListener('click', onClick)
    return () => {
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
      card.removeEventListener('click', onClick)
    }
  }, [])

  // ---------- lantern jingle animation cleanup ----------
  useEffect(() => {
    const clear = (el) => () => el && el.classList.remove('jingle')
    const l = jhLRef.current
    const r = jhRRef.current
    const lHandler = clear(l)
    const rHandler = clear(r)
    l?.addEventListener('animationend', lHandler)
    r?.addEventListener('animationend', rHandler)
    return () => {
      l?.removeEventListener('animationend', lHandler)
      r?.removeEventListener('animationend', rHandler)
    }
  }, [])

  // ---------- countdown ----------
  useEffect(() => {
    setCount(computeCountdown(Date.now(), targetMs))
    const id = setInterval(() => setCount(computeCountdown(Date.now(), targetMs)), 1000)
    return () => clearInterval(id)
  }, [targetMs])

  // ---------- per-side page title ----------
  useEffect(() => {
    document.title = side.pageTitle
  }, [side.pageTitle])

  const calendarUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(side.calendarTitle) +
    '&dates=' + side.calendarStart + '/' + side.calendarEnd +
    '&location=' + encodeURIComponent(side.venueName) +
    '&details=' + encodeURIComponent(side.calendarDetails)
  const mapsUrl = side.mapsUrl

  const chime = () => {
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext
        audioCtxRef.current = new AC()
      }
      const ac = audioCtxRef.current
      const now = ac.currentTime
      ;[1318.5, 1760, 2093, 2637].forEach((f, i) => {
        const o = ac.createOscillator()
        const g = ac.createGain()
        o.type = 'sine'
        o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01)
        const s = now + i * 0.07
        g.gain.setValueAtTime(0, s)
        g.gain.linearRampToValueAtTime(0.08, s + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, s + 1.4)
        o.connect(g).connect(ac.destination)
        o.start(s)
        o.stop(s + 1.5)
      })
    } catch (e) {
      /* no audio support, silently ignore */
    }
  }

  const open = () => {
    if (openedRef.current) return
    openedRef.current = true
    setOpened(true)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    burstRef.current(window.innerWidth / 2, window.innerHeight / 2, reduce ? 0 : 40)
    setTimeout(
      () => {
        setDoorsGone(true)
        ambientRef.current = true
        ;[jhLRef.current, jhRRef.current].forEach((j) => j && j.classList.add('jingle'))
      },
      reduce ? 50 : 1500,
    )
  }

  return (
    <>
      <canvas id="petals" ref={canvasRef} aria-hidden="true" />

      <div
        className={`doors${opened ? ' open' : ''}${doorsGone ? ' gone' : ''}`}
        id="doors"
        onClick={open}
      >
        <div className="door left" />
        <div className="door right" />
        <div className="door-text">
          <p className="door-names">{side.doorNames}</p>
          <div className="seal" aria-hidden="true">
            {side.seal}
          </div>
          <p className="door-hint">Tap to open your invitation</p>
        </div>
        <button id="openBtn" aria-label="Open the invitation" onClick={open} />
      </div>

      <main>
        <div className="scene">
          <div
            className={`card${opened ? ' live' : ''}`}
            id="card"
            ref={cardRef}
            role="img"
            aria-label={`${side.ariaName}, ${side.ceremonyTime} on ${side.ceremonyDate} at ${side.venueName}`}
          >
            <img src={side.cardImage} alt="" />
            <div className="layer" aria-hidden="true">
              <img className="jh l" ref={jhLRef} src="/jhalar-l.png" alt="" />
              <img className="jh r" ref={jhRRef} src="/jhalar-r.png" alt="" />
              <i className="twinkle" style={{ left: '19.52%', top: '25%', animationDelay: '0.2s' }} />
              <i className="twinkle" style={{ left: '28.27%', top: '24.65%', animationDelay: '1.9s' }} />
              <i className="twinkle" style={{ left: '23.94%', top: '30.52%', animationDelay: '1.1s' }} />
              <i className="twinkle" style={{ left: '43.28%', top: '26.17%', animationDelay: '2.6s' }} />
              <i className="twinkle" style={{ left: '45.12%', top: '31.56%', animationDelay: '0.7s' }} />
            </div>
            <div className="sweep" aria-hidden="true" />
            <div className="gloss" aria-hidden="true" />
          </div>
        </div>

        <section
          className={`after${opened && doorsGone ? ' show' : ''}`}
          id="after"
          aria-label="Countdown and details"
        >
          <p className="host-line">{side.hostLine}</p>
          <p className="count-line">{count.line}</p>
          {count.live && (
            <div className="count" id="count" aria-live="off">
              <div>
                <b>{count.d}</b>
                <span>days</span>
              </div>
              <div>
                <b>{count.h}</b>
                <span>hours</span>
              </div>
              <div>
                <b>{count.m}</b>
                <span>minutes</span>
              </div>
              <div>
                <b>{count.s}</b>
                <span>seconds</span>
              </div>
            </div>
          )}
          <div className="actions">
            <a href={calendarUrl} target="_blank" rel="noopener">
              Add to calendar
            </a>
            <a className="alt" href={mapsUrl} target="_blank" rel="noopener">
              Get directions
            </a>
          </div>
          <p className="tip">Tap anywhere to shower petals. Tap the lanterns to make them ring.</p>
        </section>
      </main>
    </>
  )
}

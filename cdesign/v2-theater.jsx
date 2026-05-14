// V2 — Product Theater. Premium dark stage, product-led.

function V2Theater() {
  const { NAVY, NAVY_DEEP, BLUE_CORP, BLUE_ROYAL, CYAN, GOLD } = window.TC_COLORS;
  const [tab, setTab] = React.useState('time');
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const i = setInterval(() => setTab(t => t === 'time' ? 'facts' : 'time'), 12000);
    return () => clearInterval(i);
  }, [paused]);

  const products = {
    time: {
      key: 'time',
      name: 'TrustinTime',
      logo: 'assets/trustintime-logo.png',
      kicker: 'Control horario · RRHH',
      headline: ['Cada fichaje,', 'una prueba legal.'],
      body: 'Geofence de 50m, logs firmados y 4 años de conservación. Resuelve el RDL 8/2019 para todo tu equipo — antes de que llegue la Inspección.',
      bullets: [
        { icon: 'map-marker-alt', label: 'Fichaje geoposicionado', sub: '50m geofence + IP' },
        { icon: 'umbrella-beach', label: 'Vacaciones y turnos', sub: 'Festivos por CCAA' },
        { icon: 'mobile-screen-button', label: 'App móvil empleado', sub: 'iOS + Android' },
        { icon: 'file-export', label: 'Exportación Inspección', sub: 'PDF + CSV firmado' },
      ],
      proof: [
        { label: 'Conservación', value: '4 años' },
        { label: 'Desde', value: '2 €', sub: '/usuario/mes' },
      ],
      cta: 'Ver TrustinTime',
      href: '/productos/trustintime',
      law: 'RDL 8/2019',
      lawBody: 'Obligatorio desde 2019 · Sanciones hasta 7.500 €',
      accent: BLUE_ROYAL,
      accentSoft: CYAN,
    },
    facts: {
      key: 'facts',
      name: 'TrustinFacts',
      logo: 'assets/trustinfacts-logo.png',
      kicker: 'VeriFactu · IPSI · Stock',
      headline: ['Factura firmada,', 'enviada a Hacienda.'],
      body: 'VeriFactu homologado con QR verificable y huella criptográfica. Somos los únicos del mercado con IPSI de Ceuta y Melilla nativo, no un parche.',
      bullets: [
        { icon: 'shield-halved', label: 'Homologado AEAT', sub: 'Ley Antifraude 11/2021' },
        { icon: 'percent', label: 'IPSI nativo', sub: 'Ceuta · Melilla' },
        { icon: 'boxes-stacked', label: 'Control de stock', sub: 'Márgenes en vivo' },
        { icon: 'chart-line', label: 'Dashboards reales', sub: 'Sin exportar a Excel' },
      ],
      proof: [
        { label: 'Obligatorio', value: 'Ene 2027' },
        { label: 'Desde', value: '9,99 €', sub: '/mes' },
      ],
      cta: 'Ver TrustinFacts',
      href: '/productos/trustinfacts',
      law: 'Ley 11/2021',
      lawBody: 'VeriFactu obligatorio 2027 · Sanciones hasta 150.000 €',
      accent: CYAN,
      accentSoft: GOLD,
    },
  };
  const p = products[tab];

  return (
    <section style={{
      background: `radial-gradient(ellipse at top, ${NAVY} 0%, ${NAVY_DEEP} 70%)`,
      padding: '88px 56px 96px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#fff',
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Backdrop orbs tied to accent */}
      <div style={{
        position: 'absolute', top: -220, right: -120, width: 620, height: 620, borderRadius: '50%',
        background: `radial-gradient(circle, ${p.accent}22, transparent 65%)`,
        pointerEvents: 'none', transition: 'background 1s ease',
      }}></div>
      <div style={{
        position: 'absolute', bottom: -180, left: -140, width: 540, height: 540, borderRadius: '50%',
        background: `radial-gradient(circle, ${p.accentSoft}1a, transparent 65%)`,
        pointerEvents: 'none', transition: 'background 1s ease',
      }}></div>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: .05, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
      }}></div>

      {/* ===== Top row: eyebrow + headline + tabs ===== */}
      <div style={{ maxWidth: 1320, margin: '0 auto 54px', display: 'grid', gridTemplateColumns: '1.3fr auto', gap: 40, alignItems: 'end', position: 'relative' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 18 }}>
            <span style={{ width: 30, height: 2, background: `linear-gradient(90deg,${BLUE_ROYAL},${CYAN})`, borderRadius: 2 }}></span>
            Productos
          </div>
          <h2 style={{ fontSize: 'clamp(38px,4.4vw,58px)', fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.02, margin: 0, maxWidth: 880 }}>
            Dos productos.{' '}
            <span style={{ background: `linear-gradient(120deg,${CYAN} 0%, #a5e4ff 60%, ${BLUE_ROYAL} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              Una obsesión común: Crecer sin temer.
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(226,232,240,.6)', lineHeight: 1.55, marginTop: 20, maxWidth: 640 }}>
            Contrátalos por separado o juntos. Comparten datos, cloud, IA y dashboard — y ahorran la migración dolorosa del día que los necesites juntos.
          </p>
        </div>

        {/* Segmented tab switcher with sliding indicator */}
        <SegmentedTabs tab={tab} setTab={setTab} products={products}/>
      </div>

      {/* ===== Stage ===== */}
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 64, alignItems: 'center',
        position: 'relative',
      }}>
        {/* Copy side */}
        <div key={tab + '-copy'} style={{ animation: 'v2fade .65s cubic-bezier(.2,.7,.2,1) both', position: 'relative', zIndex: 2 }}>
          <img src={p.logo} alt={p.name}
            style={{ height: 38, width: 'auto', filter: 'brightness(0) invert(1)', opacity: .95, marginBottom: 22 }}/>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 11px', borderRadius: 999,
            background: `${p.accent}1a`, border: `1px solid ${p.accent}35`, color: p.accent,
            fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 18,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent }}></span>
            {p.kicker}
          </div>
          <h3 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.02, margin: 0 }}>
            {p.headline[0]}<br/>
            <span style={{ color: p.accent }}>{p.headline[1]}</span>
          </h3>
          <p style={{ fontSize: 16.5, color: 'rgba(226,232,240,.72)', lineHeight: 1.62, margin: '20px 0 28px', maxWidth: 500 }}>
            {p.body}
          </p>

          {/* Bullet grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 22px', marginBottom: 30 }}>
            {p.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: `${p.accent}18`, border: `1px solid ${p.accent}2e`,
                  display: 'grid', placeItems: 'center', color: p.accent, fontSize: 13,
                }}>
                  <i className={`fas fa-${b.icon}`}></i>
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{b.label}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(226,232,240,.55)', marginTop: 2 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Law ribbon */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '11px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
            marginBottom: 28, maxWidth: '100%',
          }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}22`, display: 'grid', placeItems: 'center', color: GOLD, fontSize: 14 }}>
              <i className="fas fa-gavel"></i>
            </span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '.08em', textTransform: 'uppercase' }}>{p.law}</div>
              <div style={{ fontSize: 12, color: 'rgba(226,232,240,.72)' }}>{p.lawBody}</div>
            </div>
          </div>

          {/* CTA + price strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <a href={p.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 26px',
              background: p.accent, color: p.key === 'time' ? '#fff' : NAVY,
              borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 14.5,
              boxShadow: `0 24px 50px -18px ${p.accent}aa`,
              transition: 'transform .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {p.cta}
              <i className="fas fa-arrow-right" style={{ fontSize: 12 }}></i>
            </a>
            <div style={{ display: 'flex', gap: 22 }}>
              {p.proof.map((pr, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: 'rgba(226,232,240,.45)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{pr.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2 }}>
                    {pr.value}
                    {pr.sub && <span style={{ fontSize: 12, color: 'rgba(226,232,240,.55)', fontWeight: 500 }}> {pr.sub}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UI side */}
        <div style={{ position: 'relative' }}>
          {/* Glow halo */}
          <div style={{
            position: 'absolute', inset: -60, borderRadius: 40,
            background: `radial-gradient(ellipse at center, ${p.accent}25, transparent 65%)`,
            filter: 'blur(20px)', pointerEvents: 'none', transition: 'background 1s ease', zIndex: 0,
          }}></div>
          <div key={tab + '-ui'} style={{ position: 'relative', zIndex: 1, animation: 'v2slide .7s cubic-bezier(.2,.7,.2,1) both' }}>
            {tab === 'time' ? <TimeMock/> : <FactsMock/>}
          </div>

          {/* Floating proof chip */}
          <FloatingChip tab={tab} accent={p.accent} accentSoft={p.accentSoft}/>
        </div>
      </div>

      <style>{`
        @keyframes v2fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes v2slide { from { opacity: 0; transform: translateX(24px) scale(.985); } to { opacity: 1; transform: none; } }
        @keyframes chipPop { from { opacity: 0; transform: translateY(8px) scale(.92); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,.6); } 50% { box-shadow: 0 0 0 8px rgba(74,222,128,0); } }
      `}</style>
    </section>
  );
}

function SegmentedTabs({ tab, setTab, products }) {
  const { NAVY, BLUE_ROYAL, CYAN } = window.TC_COLORS;
  const refs = React.useRef({});
  const [ind, setInd] = React.useState({ left: 5, width: 0 });

  React.useLayoutEffect(() => {
    const el = refs.current[tab];
    if (!el) return;
    setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <div role="tablist" style={{
      position: 'relative', display: 'inline-flex', padding: 5, alignSelf: 'end',
      background: 'rgba(255,255,255,.05)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(14px)',
    }}>
      {/* Sliding indicator */}
      <div style={{
        position: 'absolute', top: 5, bottom: 5,
        left: ind.left, width: ind.width,
        background: '#fff', borderRadius: 11,
        transition: 'left .45s cubic-bezier(.4,.1,.2,1), width .45s cubic-bezier(.4,.1,.2,1)',
        boxShadow: '0 8px 22px -8px rgba(0,0,0,.3)',
      }}></div>
      {Object.values(products).map(item => (
        <button key={item.key} role="tab" aria-selected={tab === item.key}
          ref={el => refs.current[item.key] = el}
          onClick={() => setTab(item.key)}
          style={{
            position: 'relative', zIndex: 1, padding: '12px 22px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: tab === item.key ? NAVY : 'rgba(255,255,255,.7)',
            fontWeight: 700, fontSize: 13.5, transition: 'color .35s',
            display: 'inline-flex', alignItems: 'center', gap: 9,
          }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: item.key === 'time' ? BLUE_ROYAL : CYAN,
          }}></span>
          {item.name}
        </button>
      ))}
    </div>
  );
}

function FloatingChip({ tab, accent, accentSoft }) {
  const { NAVY } = window.TC_COLORS;
  return (
    <div key={tab + '-chip'} style={{
      position: 'absolute', left: -22, bottom: 60, zIndex: 2,
      animation: 'chipPop .6s .25s cubic-bezier(.2,.7,.2,1) both',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        background: '#fff', color: NAVY,
        padding: '12px 16px 12px 12px', borderRadius: 14,
        boxShadow: '0 20px 50px -20px rgba(2,10,42,.55), 0 0 0 1px rgba(15,23,42,.04)',
      }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: tab === 'time' ? '#dcfce7' : '#fef3c7',
          display: 'grid', placeItems: 'center',
          color: tab === 'time' ? '#166534' : '#b45309', fontSize: 14,
          animation: tab === 'time' ? 'pulse 2s infinite' : 'none',
        }}>
          <i className={tab === 'time' ? 'fas fa-fingerprint' : 'fas fa-trophy'}></i>
        </span>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 1 }}>
            {tab === 'time' ? 'Última jornada' : 'Reconocimiento'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-.01em' }}>
            {tab === 'time' ? '12 empleados fichando ahora' : '#1 CeutaTech Summit 2026'}
          </div>
        </div>
      </div>
    </div>
  );
}

window.V2Theater = V2Theater;

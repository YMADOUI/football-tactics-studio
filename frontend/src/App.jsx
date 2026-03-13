import React, { useState, useEffect } from 'react'

// En production, utiliser une URL relative (même domaine)
// En développement, utiliser localhost:4000
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4000/api'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#4285f4" stroke="#1a73e8" strokeWidth="3"/>
            <path d="M50 15 L58 35 L80 38 L63 53 L68 75 L50 63 L32 75 L37 53 L20 38 L42 35 Z" fill="white"/>
          </svg>
        </div>
        <h1>Football Tactics Studio</h1>
        <p className="login-subtitle">Connectez-vous pour accéder à votre espace</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              required
              autoFocus
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FootballPitch({ format }) {
  const dims = {
    '11v11': { width: 105, height: 68 },
    '8v8': { width: 75, height: 50 },
    '5v5': { width: 40, height: 25 },
    'training': { width: 105, height: 68 }
  }
  const d = dims[format] || dims['11v11']
  const hw = d.width / 2
  const hh = d.height / 2

  return (
    <g className="pitch-lines">
      <defs>
        <pattern id="grass" patternUnits="userSpaceOnUse" width="8" height={d.height}>
          <rect x="0" y="0" width="4" height={d.height} fill="#2d8a2d" />
          <rect x="4" y="0" width="4" height={d.height} fill="#32a032" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={d.width} height={d.height} fill="url(#grass)" />
      <rect x="0" y="0" width={d.width} height={d.height} fill="none" stroke="#fff" strokeWidth="0.4" />
      <line x1={hw} y1="0" x2={hw} y2={d.height} stroke="#fff" strokeWidth="0.4" />
      <circle cx={hw} cy={hh} r={d.height * 0.13} fill="none" stroke="#fff" strokeWidth="0.4" />
      <circle cx={hw} cy={hh} r="0.8" fill="#fff" />
      <rect x="0" y={hh - d.height * 0.3} width={d.width * 0.16} height={d.height * 0.6} fill="none" stroke="#fff" strokeWidth="0.4" />
      <rect x="0" y={hh - d.height * 0.15} width={d.width * 0.05} height={d.height * 0.3} fill="none" stroke="#fff" strokeWidth="0.4" />
      <rect x={d.width - d.width * 0.16} y={hh - d.height * 0.3} width={d.width * 0.16} height={d.height * 0.6} fill="none" stroke="#fff" strokeWidth="0.4" />
      <rect x={d.width - d.width * 0.05} y={hh - d.height * 0.15} width={d.width * 0.05} height={d.height * 0.3} fill="none" stroke="#fff" strokeWidth="0.4" />
      <rect x="-2" y={hh - 3.5} width="2" height="7" fill="none" stroke="#fff" strokeWidth="0.5" />
      <rect x={d.width} y={hh - 3.5} width="2" height="7" fill="none" stroke="#fff" strokeWidth="0.5" />
    </g>
  )
}

function Player({ player, onDrag, selected, onSelect, maxX, maxY, mode }) {
  const handlePointerDown = (e) => {
    e.stopPropagation()
    e.preventDefault() // Empêche le scroll sur mobile
    onSelect(player.id)
    const svg = e.target.ownerSVGElement
    const pt = svg.createSVGPoint()
    const getPos = (ev) => {
      pt.x = ev.clientX || (ev.touches && ev.touches[0]?.clientX)
      pt.y = ev.clientY || (ev.touches && ev.touches[0]?.clientY)
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
      return { x: Math.max(2, Math.min(maxX - 2, svgP.x)), y: Math.max(2, Math.min(maxY - 2, svgP.y)) }
    }
    const onMove = (ev) => { ev.preventDefault(); const pos = getPos(ev); onDrag(player.id, pos.x, pos.y) }
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
  }
  const isGK = player.position === 'GK'
  
  // Couleurs par défaut par équipe
  const teamColorMap = {
    home: { primary: '#4285f4', secondary: '#1a73e8' },
    away: { primary: '#ea4335', secondary: '#c5221f' },
    // Couleurs personnalisées pour l'entraînement
    blue: { primary: '#4285f4', secondary: '#1a73e8' },
    red: { primary: '#ea4335', secondary: '#c5221f' },
    green: { primary: '#34a853', secondary: '#1e8e3e' },
    orange: { primary: '#ff9800', secondary: '#f57c00' },
    purple: { primary: '#9c27b0', secondary: '#7b1fa2' },
    yellow: { primary: '#ffeb3b', secondary: '#fbc02d' },
    black: { primary: '#424242', secondary: '#212121' },
    white: { primary: '#ffffff', secondary: '#e0e0e0' }
  }
  
  // Utiliser la couleur personnalisée si définie, sinon la couleur d'équipe
  const colorKey = player.color || player.team || 'blue'
  const teamColors = teamColorMap[colorKey] || teamColorMap.blue
  const jerseyColor = isGK ? '#fbbc04' : teamColors.primary
  const textColor = (colorKey === 'yellow' || colorKey === 'white') ? '#333' : '#fff'
  const showName = mode === 'training' || player.team === 'home'
  
  return (
    <g onPointerDown={handlePointerDown} onClick={(e) => e.stopPropagation()} style={{ cursor: 'grab', touchAction: 'none' }}>
      {/* Zone de touch invisible plus grande pour mobile */}
      <circle cx={player.x} cy={player.y} r="5" fill="transparent" />
      <ellipse cx={player.x} cy={player.y + 2} rx="2" ry="0.7" fill="rgba(0,0,0,0.25)" style={{ pointerEvents: 'none' }} />
      <circle cx={player.x} cy={player.y} r={selected ? "2.5" : "2.2"} fill={jerseyColor} stroke={selected ? '#fff' : teamColors.secondary} strokeWidth={selected ? '0.5' : '0.3'} style={{ filter: selected ? 'drop-shadow(0 0 3px #fff)' : 'none', pointerEvents: 'none' }} />
      <text x={player.x} y={player.y + 0.8} textAnchor="middle" fill={textColor} fontSize="2" fontWeight="bold" fontFamily="Poppins" style={{ pointerEvents: 'none' }}>{player.number}</text>
      {showName && <text x={player.x} y={player.y + 4.5} textAnchor="middle" fill="#fff" fontSize="1.6" fontFamily="Poppins" style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{player.name.length > 6 ? player.name.slice(0,5) + '.' : player.name}</text>}
    </g>
  )
}

function Ball({ item, onDrag, selected, onSelect, maxX, maxY }) {
  const handlePointerDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect(item.id)
    const svg = e.target.ownerSVGElement
    const pt = svg.createSVGPoint()
    const getPos = (ev) => {
      pt.x = ev.clientX || (ev.touches && ev.touches[0]?.clientX)
      pt.y = ev.clientY || (ev.touches && ev.touches[0]?.clientY)
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
      return { x: Math.max(1, Math.min(maxX - 1, svgP.x)), y: Math.max(1, Math.min(maxY - 1, svgP.y)) }
    }
    const onMove = (ev) => { ev.preventDefault(); const pos = getPos(ev); onDrag(item.id, pos.x, pos.y, 'equipment') }
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
  }
  return (
    <g onPointerDown={handlePointerDown} onClick={(e) => e.stopPropagation()} style={{ cursor: 'grab', touchAction: 'none' }}>
      {/* Zone de touch invisible plus grande */}
      <circle cx={item.x} cy={item.y} r="4" fill="transparent" />
      <circle cx={item.x} cy={item.y} r="1.8" fill="#fff" stroke={selected ? '#4285f4' : '#333'} strokeWidth={selected ? '0.4' : '0.2'} style={{ pointerEvents: 'none' }} />
      <path d={`M${item.x - 0.8},${item.y - 0.5} L${item.x},${item.y - 1.2} L${item.x + 0.8},${item.y - 0.5} L${item.x + 0.5},${item.y + 0.6} L${item.x - 0.5},${item.y + 0.6} Z`} fill="#333" style={{ pointerEvents: 'none' }} />
    </g>
  )
}

function Arrow({ item, onDrag, selected, onSelect, maxX, maxY, onDragEnd }) {
  const handlePointerDown = (e, isEnd, isLine) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect(item.id)
    const svg = e.target.ownerSVGElement
    const pt = svg.createSVGPoint()
    const startX = item.x
    const startY = item.y
    const startEndX = item.endX
    const startEndY = item.endY
    let offsetX = 0, offsetY = 0
    if (isLine) {
      pt.x = e.clientX || (e.touches && e.touches[0]?.clientX)
      pt.y = e.clientY || (e.touches && e.touches[0]?.clientY)
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
      offsetX = svgP.x - item.x
      offsetY = svgP.y - item.y
    }
    const getPos = (ev) => {
      pt.x = ev.clientX || (ev.touches && ev.touches[0]?.clientX)
      pt.y = ev.clientY || (ev.touches && ev.touches[0]?.clientY)
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
      return { x: Math.max(1, Math.min(maxX - 1, svgP.x)), y: Math.max(1, Math.min(maxY - 1, svgP.y)) }
    }
    const onMove = (ev) => {
      ev.preventDefault()
      const pos = getPos(ev)
      if (isLine) {
        const dx = item.endX - item.x
        const dy = item.endY - item.y
        const newX = Math.max(1, Math.min(maxX - 1, pos.x - offsetX))
        const newY = Math.max(1, Math.min(maxY - 1, pos.y - offsetY))
        onDrag(item.id, newX, newY, 'equipment')
        onDragEnd(item.id, newX + dx, newY + dy)
      } else if (isEnd) {
        onDragEnd(item.id, pos.x, pos.y)
      } else {
        onDrag(item.id, pos.x, pos.y, 'equipment')
      }
    }
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
  }
  const angle = Math.atan2(item.endY - item.y, item.endX - item.x)
  const arrowSize = 2
  const tipX = item.endX
  const tipY = item.endY
  const leftX = tipX - arrowSize * Math.cos(angle - 0.5)
  const leftY = tipY - arrowSize * Math.sin(angle - 0.5)
  const rightX = tipX - arrowSize * Math.cos(angle + 0.5)
  const rightY = tipY - arrowSize * Math.sin(angle + 0.5)
  const color = item.color || '#000'
  return (
    <g style={{ cursor: 'grab', touchAction: 'none' }} onClick={(e) => e.stopPropagation()}>
      <line x1={item.x} y1={item.y} x2={item.endX} y2={item.endY} stroke="transparent" strokeWidth="6" onPointerDown={(e) => handlePointerDown(e, false, true)} />
      <line x1={item.x} y1={item.y} x2={item.endX} y2={item.endY} stroke={color} strokeWidth={selected ? '1' : '0.7'} strokeDasharray={item.dashed ? '2,2' : 'none'} style={{ pointerEvents: 'none' }} />
      <polygon points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`} fill={color} style={{ pointerEvents: 'none' }} />
      <circle cx={item.x} cy={item.y} r="4" fill="transparent" onPointerDown={(e) => handlePointerDown(e, false, false)} style={{ cursor: 'move' }} />
      <circle cx={item.endX} cy={item.endY} r="4" fill="transparent" onPointerDown={(e) => handlePointerDown(e, true, false)} style={{ cursor: 'move' }} />
      {selected && <>
        <circle cx={item.x} cy={item.y} r="1.5" fill="#4285f4" stroke="#fff" strokeWidth="0.3" style={{ pointerEvents: 'none' }} />
        <circle cx={item.endX} cy={item.endY} r="1.5" fill="#ea4335" stroke="#fff" strokeWidth="0.3" style={{ pointerEvents: 'none' }} />
      </>}
    </g>
  )
}

function Cone({ item, onDrag, selected, onSelect, maxX, maxY }) {
  const handlePointerDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect(item.id)
    const svg = e.target.ownerSVGElement
    const pt = svg.createSVGPoint()
    const getPos = (ev) => {
      pt.x = ev.clientX || (ev.touches && ev.touches[0]?.clientX)
      pt.y = ev.clientY || (ev.touches && ev.touches[0]?.clientY)
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
      return { x: Math.max(1, Math.min(maxX - 1, svgP.x)), y: Math.max(1, Math.min(maxY - 1, svgP.y)) }
    }
    const onMove = (ev) => { ev.preventDefault(); const pos = getPos(ev); onDrag(item.id, pos.x, pos.y, 'equipment') }
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
  }
  if (item.type === 'cone') {
    return (<g onPointerDown={handlePointerDown} onClick={(e) => e.stopPropagation()} style={{ cursor: 'grab', touchAction: 'none' }}><circle cx={item.x} cy={item.y} r="4" fill="transparent" /><polygon points={item.x + ',' + (item.y - 2.5) + ' ' + (item.x - 1.5) + ',' + (item.y + 1) + ' ' + (item.x + 1.5) + ',' + (item.y + 1)} fill="#ff6b00" stroke={selected ? '#fff' : '#cc5500'} strokeWidth={selected ? '0.4' : '0.2'} style={{ pointerEvents: 'none' }} /></g>)
  }
  return (<g onPointerDown={handlePointerDown} onClick={(e) => e.stopPropagation()} style={{ cursor: 'grab', touchAction: 'none' }}><circle cx={item.x} cy={item.y} r="3" fill="transparent" /><ellipse cx={item.x} cy={item.y} rx="1.2" ry="0.5" fill={item.color || '#ffeb3b'} stroke={selected ? '#fff' : '#fbc02d'} strokeWidth={selected ? '0.3' : '0.15'} style={{ pointerEvents: 'none' }} /></g>)
}

const formations = {
  '11v11': {
    home: [
      { id: 1, name: 'Hugo', number: 1, position: 'GK', team: 'home', x: 6, y: 34 },
      { id: 2, name: 'Lucas', number: 2, position: 'RB', team: 'home', x: 18, y: 10 },
      { id: 3, name: 'Raph', number: 4, position: 'CB', team: 'home', x: 16, y: 26 },
      { id: 4, name: 'Dayot', number: 5, position: 'CB', team: 'home', x: 16, y: 42 },
      { id: 5, name: 'Theo', number: 3, position: 'LB', team: 'home', x: 18, y: 58 },
      { id: 6, name: 'Aurel', number: 6, position: 'CDM', team: 'home', x: 32, y: 34 },
      { id: 7, name: 'Anto', number: 8, position: 'CM', team: 'home', x: 38, y: 20 },
      { id: 8, name: 'Adrien', number: 10, position: 'CAM', team: 'home', x: 38, y: 48 },
      { id: 9, name: 'Ous', number: 7, position: 'RW', team: 'home', x: 46, y: 12 },
      { id: 10, name: 'Kylian', number: 9, position: 'ST', team: 'home', x: 46, y: 34 },
      { id: 11, name: 'Marcus', number: 11, position: 'LW', team: 'home', x: 46, y: 56 }
    ],
    away: [
      { id: 101, name: 'GK', number: 1, position: 'GK', team: 'away', x: 99, y: 34 },
      { id: 102, name: 'DEF', number: 2, position: 'RB', team: 'away', x: 87, y: 10 },
      { id: 103, name: 'DEF', number: 4, position: 'CB', team: 'away', x: 89, y: 26 },
      { id: 104, name: 'DEF', number: 5, position: 'CB', team: 'away', x: 89, y: 42 },
      { id: 105, name: 'DEF', number: 3, position: 'LB', team: 'away', x: 87, y: 58 },
      { id: 106, name: 'MIL', number: 6, position: 'CDM', team: 'away', x: 73, y: 34 },
      { id: 107, name: 'MIL', number: 8, position: 'CM', team: 'away', x: 67, y: 20 },
      { id: 108, name: 'MIL', number: 10, position: 'CAM', team: 'away', x: 67, y: 48 },
      { id: 109, name: 'ATT', number: 7, position: 'RW', team: 'away', x: 59, y: 12 },
      { id: 110, name: 'ATT', number: 9, position: 'ST', team: 'away', x: 59, y: 34 },
      { id: 111, name: 'ATT', number: 11, position: 'LW', team: 'away', x: 59, y: 56 }
    ]
  },
  '8v8': {
    home: [
      { id: 1, name: 'Hugo', number: 1, position: 'GK', team: 'home', x: 5, y: 25 },
      { id: 2, name: 'Lucas', number: 2, position: 'CB', team: 'home', x: 15, y: 15 },
      { id: 3, name: 'Raph', number: 4, position: 'CB', team: 'home', x: 15, y: 35 },
      { id: 4, name: 'Aurel', number: 6, position: 'CM', team: 'home', x: 28, y: 18 },
      { id: 5, name: 'Adrien', number: 10, position: 'CM', team: 'home', x: 28, y: 32 },
      { id: 6, name: 'Ous', number: 7, position: 'RW', team: 'home', x: 35, y: 10 },
      { id: 7, name: 'Kylian', number: 9, position: 'ST', team: 'home', x: 35, y: 25 },
      { id: 8, name: 'Marcus', number: 11, position: 'LW', team: 'home', x: 35, y: 40 }
    ],
    away: [
      { id: 101, name: 'GK', number: 1, position: 'GK', team: 'away', x: 70, y: 25 },
      { id: 102, name: 'DEF', number: 2, position: 'CB', team: 'away', x: 60, y: 15 },
      { id: 103, name: 'DEF', number: 4, position: 'CB', team: 'away', x: 60, y: 35 },
      { id: 104, name: 'MIL', number: 6, position: 'CM', team: 'away', x: 47, y: 18 },
      { id: 105, name: 'MIL', number: 8, position: 'CM', team: 'away', x: 47, y: 32 },
      { id: 106, name: 'ATT', number: 7, position: 'RW', team: 'away', x: 40, y: 10 },
      { id: 107, name: 'ATT', number: 9, position: 'ST', team: 'away', x: 40, y: 25 },
      { id: 108, name: 'ATT', number: 11, position: 'LW', team: 'away', x: 40, y: 40 }
    ]
  },
  '5v5': {
    home: [
      { id: 1, name: 'Hugo', number: 1, position: 'GK', team: 'home', x: 4, y: 12.5 },
      { id: 2, name: 'Lucas', number: 2, position: 'CB', team: 'home', x: 10, y: 7 },
      { id: 3, name: 'Raph', number: 4, position: 'CB', team: 'home', x: 10, y: 18 },
      { id: 4, name: 'Kylian', number: 9, position: 'ST', team: 'home', x: 17, y: 12.5 },
      { id: 5, name: 'Marcus', number: 11, position: 'LW', team: 'home', x: 15, y: 5 }
    ],
    away: [
      { id: 101, name: 'GK', number: 1, position: 'GK', team: 'away', x: 36, y: 12.5 },
      { id: 102, name: 'DEF', number: 2, position: 'CB', team: 'away', x: 30, y: 7 },
      { id: 103, name: 'DEF', number: 4, position: 'CB', team: 'away', x: 30, y: 18 },
      { id: 104, name: 'ATT', number: 9, position: 'ST', team: 'away', x: 23, y: 12.5 },
      { id: 105, name: 'ATT', number: 11, position: 'LW', team: 'away', x: 25, y: 20 }
    ]
  }
}

const dims = { '11v11': { width: 105, height: 68 }, '8v8': { width: 75, height: 50 }, '5v5': { width: 40, height: 25 }, 'training': { width: 105, height: 68 } }

// Helper pour les appels API authentifiés
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur API')
  return data
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [mode, setMode] = useState(null)
  const [format, setFormat] = useState('11v11')
  const [players, setPlayers] = useState([])
  const [equipment, setEquipment] = useState([])
  const [selected, setSelected] = useState(null)
  const [teamName, setTeamName] = useState('Les Bleus FC')
  const [trainingPlayers, setTrainingPlayers] = useState(6)
  const [selectedTeam, setSelectedTeam] = useState(null)
  
  // États pour les séances
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [showSessionMenu, setShowSessionMenu] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  // États pour les animations
  const [frames, setFrames] = useState([]) // Liste des étapes { players, equipment }
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(1000) // ms entre chaque frame
  
  // États pour les exercices de la séance
  const [exercises, setExercises] = useState([]) // Liste des exercices { name, frames }
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1) // -1 = nouvel exercice
  const [exerciseName, setExerciseName] = useState('Exercice 1')

  // Charger les séances quand on sélectionne une équipe
  const loadSessions = async (teamId) => {
    setLoadingSessions(true)
    try {
      const data = await apiCall(`/teams/${teamId}/sessions`)
      setSessions(data.filter(s => s.type === 'training'))
    } catch (err) {
      console.error('Erreur chargement séances:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setMode(null)
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  const startMatch = (fmt) => { setFormat(fmt); setPlayers([...formations[fmt].home, ...formations[fmt].away]); setEquipment([]); setMode('match') }
  
  // Nouvelle séance d'entraînement
  const startNewTraining = () => {
    setFormat('training')
    const trainingGroup = formations['11v11'].home.slice(0, trainingPlayers).map((p, i) => ({ ...p, x: 20 + (i % 4) * 15, y: 15 + Math.floor(i / 4) * 18 }))
    setPlayers(trainingGroup)
    setEquipment([])
    setFrames([]) // Reset des frames
    setCurrentFrameIndex(0)
    setExercises([]) // Reset des exercices
    setCurrentExerciseIndex(-1)
    setExerciseName('Exercice 1')
    setCurrentSession(null)
    setSessionTitle('')
    setMode('training')
    setShowSessionMenu(false)
  }
  
  // Charger une séance existante
  const loadSession = async (session) => {
    try {
      const data = await apiCall(`/sessions/${session.id}`)
      setFormat('training')
      
      // Nouveau format avec exercices
      if (data.data?.exercises && data.data.exercises.length > 0) {
        setExercises(data.data.exercises)
        // Charger le premier exercice
        const firstEx = data.data.exercises[0]
        if (firstEx.frames && firstEx.frames.length > 0) {
          setFrames(firstEx.frames)
          setPlayers(firstEx.frames[0].players || [])
          setEquipment(firstEx.frames[0].equipment || [])
        } else {
          setFrames([])
          setPlayers([])
          setEquipment([])
        }
        setCurrentExerciseIndex(0)
        setExerciseName(firstEx.name || 'Exercice 1')
        setCurrentFrameIndex(0)
      }
      // Ancien format avec frames directement
      else if (data.data?.frames && data.data.frames.length > 0) {
        // Convertir l'ancien format en exercice unique
        const oldExercise = { name: 'Exercice 1', frames: data.data.frames }
        setExercises([oldExercise])
        setFrames(data.data.frames)
        setPlayers(data.data.frames[0].players || [])
        setEquipment(data.data.frames[0].equipment || [])
        setCurrentExerciseIndex(0)
        setExerciseName('Exercice 1')
        setCurrentFrameIndex(0)
      } else {
        // Ancien format sans frames
        setPlayers(data.data?.players || [])
        setEquipment(data.data?.equipment || [])
        setFrames([])
        setExercises([])
        setCurrentExerciseIndex(-1)
        setExerciseName('Exercice 1')
        setCurrentFrameIndex(0)
      }
      setCurrentSession(data)
      setSessionTitle(data.title)
      setMode('training')
      setShowSessionMenu(false)
    } catch (err) {
      alert('Erreur lors du chargement: ' + err.message)
    }
  }
  
  // ============ FONCTIONS D'ANIMATION ============
  
  // Ajouter une nouvelle frame (étape)
  const addFrame = () => {
    const newFrame = {
      players: JSON.parse(JSON.stringify(players)),
      equipment: JSON.parse(JSON.stringify(equipment))
    }
    const newFrames = [...frames, newFrame]
    setFrames(newFrames)
    setCurrentFrameIndex(newFrames.length - 1)
  }
  
  // Mettre à jour la frame courante avec les positions actuelles
  const updateCurrentFrame = () => {
    if (frames.length === 0) return
    const updatedFrames = [...frames]
    updatedFrames[currentFrameIndex] = {
      players: JSON.parse(JSON.stringify(players)),
      equipment: JSON.parse(JSON.stringify(equipment))
    }
    setFrames(updatedFrames)
  }
  
  // Aller à une frame spécifique
  const goToFrame = (index) => {
    if (index < 0 || index >= frames.length) return
    setCurrentFrameIndex(index)
    setPlayers(JSON.parse(JSON.stringify(frames[index].players)))
    setEquipment(JSON.parse(JSON.stringify(frames[index].equipment)))
  }
  
  // Supprimer une frame
  const deleteFrame = (index) => {
    if (frames.length <= 1) {
      setFrames([])
      setCurrentFrameIndex(0)
      return
    }
    const newFrames = frames.filter((_, i) => i !== index)
    setFrames(newFrames)
    const newIndex = Math.min(currentFrameIndex, newFrames.length - 1)
    setCurrentFrameIndex(newIndex)
    setPlayers(JSON.parse(JSON.stringify(newFrames[newIndex].players)))
    setEquipment(JSON.parse(JSON.stringify(newFrames[newIndex].equipment)))
  }
  
  // Jouer l'animation
  const playAnimation = () => {
    if (frames.length < 2) return
    setIsPlaying(true)
    setCurrentFrameIndex(0)
    setPlayers(JSON.parse(JSON.stringify(frames[0].players)))
    setEquipment(JSON.parse(JSON.stringify(frames[0].equipment)))
  }
  
  // Stopper l'animation
  const stopAnimation = () => {
    setIsPlaying(false)
  }
  
  // Effect pour gérer l'animation
  useEffect(() => {
    if (!isPlaying || frames.length < 2) return
    
    const timer = setTimeout(() => {
      const nextIndex = currentFrameIndex + 1
      if (nextIndex >= frames.length) {
        setIsPlaying(false) // Fin de l'animation
      } else {
        setCurrentFrameIndex(nextIndex)
        // Animation fluide avec interpolation
        animateToFrame(frames[currentFrameIndex], frames[nextIndex])
      }
    }, animationSpeed)
    
    return () => clearTimeout(timer)
  }, [isPlaying, currentFrameIndex, frames, animationSpeed])
  
  // Animation fluide entre 2 frames
  const animateToFrame = (fromFrame, toFrame) => {
    const duration = animationSpeed * 0.8 // 80% du temps pour l'animation
    const steps = 20
    const stepDuration = duration / steps
    let step = 0
    
    const animate = () => {
      step++
      const progress = step / steps
      const easeProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic
      
      // Interpoler les positions des joueurs
      const interpolatedPlayers = fromFrame.players.map((p, i) => {
        const toPlayer = toFrame.players[i]
        if (!toPlayer) return p
        return {
          ...p,
          x: p.x + (toPlayer.x - p.x) * easeProgress,
          y: p.y + (toPlayer.y - p.y) * easeProgress
        }
      })
      
      // Interpoler les positions des équipements
      const interpolatedEquipment = fromFrame.equipment.map((e, i) => {
        const toEquip = toFrame.equipment[i]
        if (!toEquip) return e
        const result = {
          ...e,
          x: e.x + (toEquip.x - e.x) * easeProgress,
          y: e.y + (toEquip.y - e.y) * easeProgress
        }
        if (e.type === 'arrow' && toEquip.endX !== undefined) {
          result.endX = e.endX + (toEquip.endX - e.endX) * easeProgress
          result.endY = e.endY + (toEquip.endY - e.endY) * easeProgress
        }
        return result
      })
      
      setPlayers(interpolatedPlayers)
      setEquipment(interpolatedEquipment)
      
      if (step < steps && isPlaying) {
        setTimeout(animate, stepDuration)
      }
    }
    
    animate()
  }
  
  // ============ FONCTIONS EXERCICES ============
  
  // Sauvegarder l'exercice courant dans la liste des exercices
  const saveCurrentExercise = () => {
    if (frames.length === 0) {
      alert('Ajoutez au moins une étape avant de sauvegarder l\'exercice')
      return
    }
    
    const exercise = {
      name: exerciseName || `Exercice ${exercises.length + 1}`,
      frames: JSON.parse(JSON.stringify(frames))
    }
    
    if (currentExerciseIndex >= 0) {
      // Mettre à jour l'exercice existant
      const newExercises = [...exercises]
      newExercises[currentExerciseIndex] = exercise
      setExercises(newExercises)
    } else {
      // Ajouter un nouvel exercice
      setExercises([...exercises, exercise])
      setCurrentExerciseIndex(exercises.length)
    }
    setSaveMessage('✓ Exercice enregistré!')
    setTimeout(() => setSaveMessage(''), 2000)
  }
  
  // Créer un nouvel exercice (reset du terrain)
  const newExercise = () => {
    // Si l'exercice courant a des frames non sauvegardées, proposer de sauvegarder
    if (frames.length > 0 && currentExerciseIndex < 0) {
      const save = window.confirm('Voulez-vous enregistrer l\'exercice en cours avant d\'en créer un nouveau ?')
      if (save) {
        saveCurrentExercise()
      }
    }
    
    // Reset pour un nouvel exercice
    const trainingGroup = formations['11v11'].home.slice(0, trainingPlayers).map((p, i) => ({ 
      ...p, 
      x: 20 + (i % 4) * 15, 
      y: 15 + Math.floor(i / 4) * 18,
      color: 'blue'
    }))
    setPlayers(trainingGroup)
    setEquipment([])
    setFrames([])
    setCurrentFrameIndex(0)
    setCurrentExerciseIndex(-1)
    setExerciseName(`Exercice ${exercises.length + 1}`)
  }
  
  // Charger un exercice existant pour le modifier ou rejouer
  const loadExercise = (index) => {
    if (index < 0 || index >= exercises.length) return
    const exercise = exercises[index]
    setFrames(JSON.parse(JSON.stringify(exercise.frames)))
    if (exercise.frames.length > 0) {
      setPlayers(JSON.parse(JSON.stringify(exercise.frames[0].players)))
      setEquipment(JSON.parse(JSON.stringify(exercise.frames[0].equipment)))
    }
    setCurrentFrameIndex(0)
    setCurrentExerciseIndex(index)
    setExerciseName(exercise.name)
  }
  
  // Supprimer un exercice
  const deleteExercise = (index) => {
    if (!window.confirm(`Supprimer "${exercises[index].name}" ?`)) return
    const newExercises = exercises.filter((_, i) => i !== index)
    setExercises(newExercises)
    if (currentExerciseIndex === index) {
      // Si on supprime l'exercice en cours, reset
      newExercise()
    } else if (currentExerciseIndex > index) {
      setCurrentExerciseIndex(currentExerciseIndex - 1)
    }
  }
  
  // Jouer un exercice spécifique
  const playExercise = (index) => {
    loadExercise(index)
    setTimeout(() => playAnimation(), 100)
  }
  
  // Sauvegarder la séance
  const saveSession = async () => {
    if (!sessionTitle.trim()) {
      alert('Veuillez entrer un titre pour la séance')
      return
    }
    
    // Sauvegarder l'exercice en cours s'il a des frames
    let finalExercises = [...exercises]
    if (frames.length > 0) {
      const currentExercise = {
        name: exerciseName || `Exercice ${finalExercises.length + 1}`,
        frames: JSON.parse(JSON.stringify(frames))
      }
      if (currentExerciseIndex >= 0) {
        finalExercises[currentExerciseIndex] = currentExercise
      } else {
        finalExercises.push(currentExercise)
      }
    }
    
    setSaving(true)
    setSaveMessage('')
    try {
      // Nouveau format avec exercices
      const sessionData = { 
        exercises: finalExercises,
        players, 
        equipment 
      }
      
      if (currentSession) {
        // Mise à jour
        await apiCall(`/sessions/${currentSession.id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: sessionTitle, type: 'training', format: 'training', data: sessionData })
        })
        setSaveMessage('✓ Séance mise à jour!')
      } else {
        // Création
        const newSession = await apiCall('/sessions', {
          method: 'POST',
          body: JSON.stringify({ title: sessionTitle, type: 'training', format: 'training', teamId: selectedTeam.id, data: sessionData })
        })
        setCurrentSession(newSession)
        setSaveMessage('✓ Séance créée!')
      }
      setExercises(finalExercises)
      if (currentExerciseIndex < 0 && frames.length > 0) {
        setCurrentExerciseIndex(finalExercises.length - 1)
      }
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      alert('Erreur sauvegarde: ' + err.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Ouvrir le menu des séances
  const openSessionMenu = () => {
    loadSessions(selectedTeam.id)
    setShowSessionMenu(true)
  }

  const onDrag = (id, x, y, type) => { if (type === 'equipment') { setEquipment(eq => eq.map(e => e.id === id ? { ...e, x, y } : e)) } else { setPlayers(ps => ps.map(p => p.id === id ? { ...p, x, y } : p)) } }
  const onDragArrowEnd = (id, x, y) => { setEquipment(eq => eq.map(e => e.id === id ? { ...e, endX: x, endY: y } : e)) }
  const addCone = () => { setEquipment(eq => [...eq, { id: Date.now(), type: 'cone', x: 52.5, y: 34 }]) }
  const addDisc = (color) => { setEquipment(eq => [...eq, { id: Date.now(), type: 'disc', x: 52.5, y: 34, color }]) }
  const addBall = () => { setEquipment(eq => [...eq, { id: Date.now(), type: 'ball', x: 52.5, y: 34 }]) }
  const addArrow = (color, dashed) => { setEquipment(eq => [...eq, { id: Date.now(), type: 'arrow', x: 45, y: 34, endX: 60, endY: 34, color, dashed }]) }
  const addPlayer = (color = 'blue') => { const num = players.length + 1; setPlayers(ps => [...ps, { id: Date.now(), name: 'J' + num, number: num, position: 'CM', team: 'home', color, x: 52.5, y: 34 }]) }
  const changeSelectedColor = (newColor) => { if (selected) { setPlayers(ps => ps.map(p => p.id === selected ? { ...p, color: newColor } : p)) } }
  const removeSelected = () => { if (!selected) return; setPlayers(ps => ps.filter(p => p.id !== selected)); setEquipment(eq => eq.filter(e => e.id !== selected)); setSelected(null) }

  const d = dims[format] || dims['11v11']

  if (!mode) {
    return (
      <div className="app menu-screen">
        <header>
          <h1>Football Tactics Studio</h1>
          <div className="user-info">
            <span className="user-name">{user.firstName || user.username}</span>
            <span className="user-role">{user.role === 'ENTRAINEUR' ? 'Entraîneur' : 'Joueur'}</span>
            <button className="logout-btn" onClick={logout}>Déconnexion</button>
          </div>
        </header>
        {!selectedTeam && user.memberships?.length > 0 ? (
          <div className="team-selection">
            <h2>Sélectionnez une équipe</h2>
            <div className="team-grid">
              {user.memberships.map(m => (
                <div key={m.team.id} className="team-card" onClick={() => { setSelectedTeam(m.team); setTeamName(m.team.name) }}>
                  <div className="team-icon">{m.team.category === 'Senior' ? '⚽' : m.team.category}</div>
                  <div className="team-name">{m.team.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : showSessionMenu ? (
          <div className="session-menu">
            <button className="back-link" onClick={() => setShowSessionMenu(false)}>← Retour</button>
            <h2>Séances d'entraînement</h2>
            <p className="session-subtitle">Équipe: <strong>{selectedTeam?.name}</strong></p>
            
            {/* Seulement pour les entraineurs */}
            {user.role === 'ENTRAINEUR' && (
              <div className="session-actions">
                <div className="new-session-card" onClick={startNewTraining}>
                  <div className="new-icon">+</div>
                  <div className="new-text">
                    <strong>Nouvelle séance</strong>
                    <span>Créer une séance vierge</span>
                  </div>
                </div>
                
                <div className="players-slider">
                  <label>Joueurs pour nouvelle séance: <strong>{trainingPlayers}</strong></label>
                  <input type="range" min="1" max="20" value={trainingPlayers} onChange={e => setTrainingPlayers(parseInt(e.target.value))} />
                </div>
              </div>
            )}
            
            {loadingSessions ? (
              <div className="loading">Chargement des séances...</div>
            ) : sessions.length > 0 ? (
              <div className="sessions-list">
                <h3>{user.role === 'ENTRAINEUR' ? 'Mes séances sauvegardées' : 'Séances disponibles'}</h3>
                {sessions.map(s => (
                  <div key={s.id} className="session-item" onClick={() => loadSession(s)}>
                    <div className="session-info">
                      <strong>{s.title}</strong>
                      <span>{new Date(s.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="session-arrow">→</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-sessions">
                <p>Aucune séance disponible pour cette équipe</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {selectedTeam && (
              <div className="selected-team-banner">
                <button className="change-team-btn" onClick={() => setSelectedTeam(null)}>← Changer d'équipe</button>
                <span>Équipe: <strong>{selectedTeam.name}</strong></span>
              </div>
            )}
            <div className="menu-container">
              {/* Mode Match - seulement pour les entraineurs */}
              {user.role === 'ENTRAINEUR' && (
                <div className="menu-card">
                  <h2>Mode Match</h2>
                  <p>Choisis ton format et place tes 2 équipes</p>
                  <div className="format-buttons">
                    <button onClick={() => startMatch('11v11')}>11 vs 11</button>
                    <button onClick={() => startMatch('8v8')}>8 vs 8</button>
                    <button onClick={() => startMatch('5v5')}>5 vs 5</button>
                  </div>
                </div>
              )}
              <div className="menu-card">
                <h2>Séances d'entraînement</h2>
                <p>{user.role === 'ENTRAINEUR' ? 'Crée ou récupère une séance' : 'Consulte les séances de ton équipe'}</p>
                <button onClick={openSessionMenu}>Accéder aux séances</button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Variable pour savoir si on peut éditer
  const canEdit = user.role === 'ENTRAINEUR'

  return (
    <div className="app">
      <header>
        <h1>Football Tactics Studio</h1>
        <div className="header-right">
          <span className="team-badge">{selectedTeam?.name || teamName}</span>
          <button className="back-btn" onClick={() => { setMode(null); setShowSessionMenu(false) }}>Retour</button>
        </div>
      </header>
      <div className="main-content">
        <div className="pitch-container">
          <svg viewBox={'-3 -1 ' + (d.width + 6) + ' ' + (d.height + 2)} className="pitch" onClick={() => setSelected(null)}>
            <FootballPitch format={format} />
            {equipment.filter(e => e.type === 'arrow').map(e => (<Arrow key={e.id} item={e} onDrag={canEdit ? onDrag : () => {}} onDragEnd={canEdit ? onDragArrowEnd : () => {}} selected={canEdit && selected === e.id} onSelect={canEdit ? setSelected : () => {}} maxX={d.width} maxY={d.height} />))}
            {equipment.filter(e => e.type !== 'arrow' && e.type !== 'ball').map(e => (<Cone key={e.id} item={e} onDrag={canEdit ? onDrag : () => {}} selected={canEdit && selected === e.id} onSelect={canEdit ? setSelected : () => {}} maxX={d.width} maxY={d.height} />))}
            {equipment.filter(e => e.type === 'ball').map(e => (<Ball key={e.id} item={e} onDrag={canEdit ? onDrag : () => {}} selected={canEdit && selected === e.id} onSelect={canEdit ? setSelected : () => {}} maxX={d.width} maxY={d.height} />))}
            {players.map(p => (<Player key={p.id} player={p} onDrag={canEdit ? onDrag : () => {}} selected={canEdit && selected === p.id} onSelect={canEdit ? setSelected : () => {}} maxX={d.width} maxY={d.height} mode={mode} />))}
          </svg>
        </div>
        <div className="sidebar">
          <div className="panel mode-badge">
            {mode === 'match' ? 'Match ' + format : 'Entraînement'}
            {!canEdit && <span className="view-only-badge">Consultation</span>}
          </div>
          
          {/* Outils - seulement pour les entraineurs */}
          {canEdit && !isPlaying && (
            <div className="panel">
              <h3>Outils</h3>
              <div className="tool-buttons">
                <button onClick={addBall}>Ballon</button>
                <button onClick={() => addArrow('#000', false)}>Flèche</button>
                <button onClick={() => addArrow('#000', true)}>Passe</button>
                <button onClick={() => addArrow('#ea4335', false)}>Tir</button>
                {mode === 'training' && <><button onClick={addCone}>Plot</button><button onClick={() => addDisc('#ffeb3b')}>Coupelle J</button><button onClick={() => addDisc('#f44336')}>Coupelle R</button><button onClick={() => addDisc('#2196f3')}>Coupelle B</button></>}
              </div>
              {mode === 'training' && (
                <>
                  <h4 style={{marginTop: '10px', marginBottom: '5px', fontSize: '12px', color: '#666'}}>Ajouter Joueur</h4>
                  <div className="color-buttons">
                    <button className="color-btn" style={{background: '#4285f4'}} onClick={() => addPlayer('blue')} title="Équipe Bleue">🧑</button>
                    <button className="color-btn" style={{background: '#ea4335'}} onClick={() => addPlayer('red')} title="Équipe Rouge">🧑</button>
                    <button className="color-btn" style={{background: '#34a853'}} onClick={() => addPlayer('green')} title="Vert">🧑</button>
                    <button className="color-btn" style={{background: '#ff9800'}} onClick={() => addPlayer('orange')} title="Orange">🧑</button>
                    <button className="color-btn" style={{background: '#9c27b0'}} onClick={() => addPlayer('purple')} title="Violet">🧑</button>
                    <button className="color-btn" style={{background: '#424242', color: '#fff'}} onClick={() => addPlayer('black')} title="Noir">🧑</button>
                    <button className="color-btn" style={{background: '#fff', border: '1px solid #ccc'}} onClick={() => addPlayer('white')} title="Blanc">🧑</button>
                    <button className="color-btn" style={{background: '#ffeb3b'}} onClick={() => addPlayer('yellow')} title="Gardien">🧤</button>
                  </div>
                  {selected && players.find(p => p.id === selected) && (
                    <>
                      <h4 style={{marginTop: '10px', marginBottom: '5px', fontSize: '12px', color: '#666'}}>Changer couleur</h4>
                      <div className="color-buttons">
                        <button className="color-btn small" style={{background: '#4285f4'}} onClick={() => changeSelectedColor('blue')} title="Bleu"></button>
                        <button className="color-btn small" style={{background: '#ea4335'}} onClick={() => changeSelectedColor('red')} title="Rouge"></button>
                        <button className="color-btn small" style={{background: '#34a853'}} onClick={() => changeSelectedColor('green')} title="Vert"></button>
                        <button className="color-btn small" style={{background: '#ff9800'}} onClick={() => changeSelectedColor('orange')} title="Orange"></button>
                        <button className="color-btn small" style={{background: '#9c27b0'}} onClick={() => changeSelectedColor('purple')} title="Violet"></button>
                        <button className="color-btn small" style={{background: '#424242'}} onClick={() => changeSelectedColor('black')} title="Noir"></button>
                        <button className="color-btn small" style={{background: '#fff', border: '1px solid #ccc'}} onClick={() => changeSelectedColor('white')} title="Blanc"></button>
                        <button className="color-btn small" style={{background: '#ffeb3b'}} onClick={() => changeSelectedColor('yellow')} title="Jaune"></button>
                      </div>
                    </>
                  )}
                </>
              )}
              {selected && <button className="delete-btn" onClick={removeSelected}>Supprimer</button>}
            </div>
          )}
          
          {/* Panneau des exercices - seulement en mode training */}
          {mode === 'training' && (
            <div className="panel exercises-panel">
              <h3>📋 Exercices de la séance</h3>
              
              {/* Liste des exercices enregistrés */}
              {exercises.length > 0 && (
                <div className="exercises-list">
                  {exercises.map((ex, index) => (
                    <div 
                      key={index} 
                      className={`exercise-item ${index === currentExerciseIndex ? 'active' : ''}`}
                    >
                      <div className="exercise-info" onClick={() => !isPlaying && loadExercise(index)}>
                        <span className="exercise-number">{index + 1}</span>
                        <span className="exercise-name">{ex.name}</span>
                        <span className="exercise-frames">{ex.frames?.length || 0} étapes</span>
                      </div>
                      <div className="exercise-actions">
                        <button 
                          className="exercise-play-btn" 
                          onClick={() => playExercise(index)}
                          disabled={isPlaying || !ex.frames || ex.frames.length < 2}
                          title="Jouer cet exercice"
                        >▶</button>
                        {canEdit && (
                          <button 
                            className="exercise-delete-btn" 
                            onClick={() => deleteExercise(index)}
                            disabled={isPlaying}
                          >×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Bouton nouvel exercice */}
              {canEdit && !isPlaying && (
                <button className="new-exercise-btn" onClick={newExercise}>
                  + Nouvel exercice
                </button>
              )}
              
              {exercises.length === 0 && (
                <p className="exercises-hint">Créez des exercices et enregistrez-les pour les voir ici</p>
              )}
            </div>
          )}
          
          {/* Panneau d'animation - seulement en mode training */}
          {mode === 'training' && (
            <div className="panel animation-panel">
              <h3>🎬 {currentExerciseIndex >= 0 ? exercises[currentExerciseIndex]?.name : exerciseName}</h3>
              
              {/* Nom de l'exercice */}
              {canEdit && !isPlaying && (
                <input 
                  type="text" 
                  value={exerciseName}
                  onChange={e => setExerciseName(e.target.value)}
                  placeholder="Nom de l'exercice..."
                  className="exercise-name-input"
                />
              )}
              
              {/* Contrôles de lecture */}
              <div className="animation-controls">
                {!isPlaying ? (
                  <button 
                    className="play-btn" 
                    onClick={playAnimation} 
                    disabled={frames.length < 2}
                    title={frames.length < 2 ? "Ajoutez au moins 2 étapes" : "Jouer l'animation"}
                  >
                    ▶ Jouer
                  </button>
                ) : (
                  <button className="stop-btn" onClick={stopAnimation}>
                    ⏹ Stop
                  </button>
                )}
                
                {canEdit && !isPlaying && (
                  <button className="add-frame-btn" onClick={addFrame}>
                    + Étape
                  </button>
                )}
                
                {canEdit && !isPlaying && frames.length > 0 && (
                  <button className="save-exercise-btn" onClick={saveCurrentExercise}>
                    💾 Enregistrer
                  </button>
                )}
              </div>
              
              {/* Vitesse */}
              <div className="speed-control">
                <label>Vitesse: {animationSpeed / 1000}s</label>
                <input 
                  type="range" 
                  min="300" 
                  max="3000" 
                  step="100"
                  value={animationSpeed} 
                  onChange={e => setAnimationSpeed(parseInt(e.target.value))}
                  disabled={isPlaying}
                />
              </div>
              
              {/* Timeline des frames */}
              {frames.length > 0 && (
                <div className="frames-timeline">
                  <div className="frames-label">Étapes ({frames.length})</div>
                  <div className="frames-list">
                    {frames.map((_, index) => (
                      <div 
                        key={index} 
                        className={`frame-item ${index === currentFrameIndex ? 'active' : ''}`}
                        onClick={() => !isPlaying && goToFrame(index)}
                      >
                        <span className="frame-number">{index + 1}</span>
                        {canEdit && !isPlaying && (
                          <button 
                            className="frame-delete" 
                            onClick={(e) => { e.stopPropagation(); deleteFrame(index); }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {canEdit && !isPlaying && frames.length > 0 && (
                    <button className="update-frame-btn" onClick={updateCurrentFrame}>
                      💾 Sauver étape {currentFrameIndex + 1}
                    </button>
                  )}
                </div>
              )}
              
              {frames.length === 0 && canEdit && (
                <p className="animation-hint">
                  Placez vos joueurs puis cliquez sur "+ Étape" pour créer la première position
                </p>
              )}
            </div>
          )}
          
          {/* Titre de séance - seulement pour les entraineurs en mode training */}
          {mode === 'training' && canEdit && (
            <div className="panel">
              <h3>Ma séance</h3>
              <input 
                type="text" 
                value={sessionTitle} 
                onChange={e => setSessionTitle(e.target.value)} 
                placeholder="Titre de la séance..." 
                className="session-title-input"
              />
              {currentSession && <span className="session-status">Modification en cours</span>}
            </div>
          )}
          
          {/* Affichage titre pour les joueurs */}
          {mode === 'training' && !canEdit && currentSession && (
            <div className="panel">
              <h3>Séance</h3>
              <p className="session-title-display">{currentSession.title}</p>
              <span className="session-date">Créée le {new Date(currentSession.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          
          <div className="panel"><h3>Joueurs ({players.filter(p => p.team === 'home').length})</h3><ul className="player-list">{players.filter(p => p.team === 'home').map(p => (<li key={p.id} className={(selected === p.id ? 'selected ' : '') + p.team} onClick={() => canEdit && setSelected(p.id)}><span className="number">{p.number}</span><span className="name">{p.name}</span><span className="pos">{p.position}</span></li>))}</ul></div>
          
          {/* Bouton sauvegarder - seulement pour les entraineurs */}
          {mode === 'training' && canEdit && (
            <div className="save-section">
              <button className="save-btn" onClick={saveSession} disabled={saving}>
                {saving ? 'Sauvegarde...' : (currentSession ? 'Mettre à jour' : 'Sauvegarder')}
              </button>
              {saveMessage && <div className="save-message">{saveMessage}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

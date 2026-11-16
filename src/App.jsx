import { useEffect, useState } from 'react'
import Invitation from './Invitation.jsx'
import Landing from './Landing.jsx'
import { sides } from './sides.js'

function resolveSide(pathname) {
  // Strip leading slash and any trailing slash.
  const key = pathname.replace(/^\/+|\/+$/g, '').toLowerCase()
  return sides[key] ?? null
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const side = resolveSide(pathname)
  if (side) return <Invitation side={side} />
  return <Landing />
}

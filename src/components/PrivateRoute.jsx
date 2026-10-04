import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { API_BASE } from '../config'
import { isGuest } from '../guestSession'

const BASE_URL = API_BASE

export default function PrivateRoute({ children }) {
    const [status, setStatus] = useState('checking') // 'checking' | 'ok' | 'denied'

    useEffect(() => {
        fetch(`${BASE_URL}/api/auth/me`, {
            credentials: 'include'
        })
            .then(res => {
                if (res.ok) setStatus('ok')
                else if (isGuest()) setStatus('ok')
                else setStatus('denied')
            })
            .catch(() => setStatus(isGuest() ? 'ok' : 'denied'))
    }, [])

    if (status === 'checking') return null
    if (status === 'denied')   return <Navigate to="/login" replace />
    return children
}

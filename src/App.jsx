import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import TripOverview from './pages/TripOverview'
import TripDetails from './pages/TripDetails'
import InvitePage from './pages/InvitePage'
import Settings from './pages/Settings'
import About from './pages/About'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Public so an invited user can see the invite before they have an account */}
      <Route path="/invite/:token" element={<InvitePage />} />

      <Route path="/home"          element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/trips"         element={<PrivateRoute><TripOverview /></PrivateRoute>} />
      <Route path="/trips/details" element={<PrivateRoute><TripDetails /></PrivateRoute>} />
      <Route path="/settings"      element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/about"         element={<PrivateRoute><About /></PrivateRoute>} />
    </Routes>
  )
}

export default App

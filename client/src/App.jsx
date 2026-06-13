import { useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BookingWidget from './components/BookingWidget'
import Home from './pages/Home'
import Services from './pages/Services'
import Masters from './pages/Masters'
import Profile from './pages/Profile'
import History from './pages/History'
import MasterDashboard from './pages/MasterDashboard'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { BookingContext } from './context/BookingContext'

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingParams, setBookingParams] = useState({})

  const bookingContextValue = useMemo(() => ({
    openBooking: (params = {}) => {
      setBookingParams(params)
      setIsBookingOpen(true)
    },
    closeBooking: () => {
      setIsBookingOpen(false)
      setBookingParams({})
    },
  }), [])

  return (
    <AuthProvider>
      <BookingContext.Provider value={bookingContextValue}>
        <BrowserRouter>
          <div className="min-h-screen bg-white font-sans text-neutral-950">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/masters" element={<Masters />} />
                <Route
                  path="/profile"
                  element={(
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/history"
                  element={(
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/master"
                  element={(
                    <ProtectedRoute allowedRoles={['MASTER']}>
                      <MasterDashboard />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/admin"
                  element={(
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  )}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />

            {isBookingOpen && (
              <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-neutral-950/60 px-4 py-8">
                <div
                  className="absolute inset-0"
                  aria-hidden="true"
                  onClick={bookingContextValue.closeBooking}
                />
                <section
                  className="relative w-full max-w-5xl bg-white p-4 shadow-2xl sm:p-6"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Онлайн-запись"
                >
                  <button
                    type="button"
                    className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center border border-neutral-200 bg-white text-xl leading-none text-neutral-500 transition hover:border-neutral-950 hover:text-neutral-950"
                    onClick={bookingContextValue.closeBooking}
                    aria-label="Закрыть"
                  >
                    ×
                  </button>
                  <BookingWidget
                    initialParams={bookingParams}
                    onBooked={bookingContextValue.closeBooking}
                  />
                </section>
              </div>
            )}
          </div>
        </BrowserRouter>
      </BookingContext.Provider>
    </AuthProvider>
  )
}

export default App

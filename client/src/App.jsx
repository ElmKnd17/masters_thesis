import { useEffect, useMemo, useState } from 'react'
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

  useEffect(() => {
    if (!isBookingOpen) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isBookingOpen])

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
              <div className="fixed inset-0 z-40 flex items-stretch justify-center bg-neutral-950/60 px-3 py-4 sm:items-center sm:px-4 sm:py-8">
                <div
                  className="absolute inset-0"
                  aria-hidden="true"
                  onClick={bookingContextValue.closeBooking}
                />
                <section
                  className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[calc(100dvh-4rem)]"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Онлайн-запись"
                >
                  <div className="flex shrink-0 justify-end border-b border-neutral-200 bg-white p-3 sm:p-4">
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center border border-neutral-200 bg-white text-xl leading-none text-neutral-500 transition hover:border-neutral-950 hover:text-neutral-950"
                      onClick={bookingContextValue.closeBooking}
                      aria-label="Закрыть"
                    >
                      ×
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
                    <BookingWidget
                      initialParams={bookingParams}
                      onBooked={bookingContextValue.closeBooking}
                    />
                  </div>
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

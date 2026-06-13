import { createContext, useContext } from 'react'

export const BookingContext = createContext({
  openBooking: (params) => { void params },
  closeBooking: () => {},
})

export const useBooking = () => useContext(BookingContext)

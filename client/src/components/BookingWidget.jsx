import { useEffect, useMemo, useState } from 'react'
import Button from './Button'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const getToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getServiceLabel = (service) => {
  const price = service.price ? ` · ${service.price} ₽` : ''
  const duration = service.duration ? ` · ${service.duration} мин` : ''

  return `${service.name}${price}${duration}`
}

const getMasterName = (master) => (
  master.user?.name || master.name || `Мастер #${master.id}`
)

const masterCanProvideService = (master, serviceId) => {
  if (!serviceId) return true
  if (!Array.isArray(master.services) || master.services.length === 0) return true

  return master.services.some((service) => String(service.id) === String(serviceId))
}

const getInitialId = (value) => (value ? String(value) : '')

function BookingWidget({ initialParams = {}, onBooked }) {
  const { authUser, openAuthModal } = useAuth()
  const [services, setServices] = useState([])
  const [masters, setMasters] = useState([])
  const [serviceId, setServiceId] = useState(getInitialId(initialParams.serviceId))
  const [masterId, setMasterId] = useState(getInitialId(initialParams.masterId))
  const [date, setDate] = useState(getToday())
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const availableMasters = useMemo(
    () => masters.filter((master) => masterCanProvideService(master, serviceId)),
    [masters, serviceId],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setServiceId(getInitialId(initialParams.serviceId))
      setMasterId(getInitialId(initialParams.masterId))
      setSlots([])
      setSelectedSlot(null)
      setMessage('')
      setError('')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [initialParams])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingData(true)
        setError('')

        const [servicesResponse, mastersResponse] = await Promise.all([
          api.get('/services'),
          api.get('/masters'),
        ])

        setServices(servicesResponse.data || [])
        setMasters(mastersResponse.data || [])
      } catch (requestError) {
        setError(
          requestError.response?.data?.message
          || 'Не удалось загрузить услуги и мастеров',
        )
      } finally {
        setIsLoadingData(false)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const loadSlots = async () => {
      if (!serviceId || !masterId || !date) {
        setSlots([])
        setSelectedSlot(null)
        return
      }

      try {
        setIsLoadingSlots(true)
        setError('')
        setMessage('')
        setSelectedSlot(null)

        const response = await api.get('/appointments/available-slots', {
          params: {
            serviceId,
            masterId,
            date,
          },
        })

        setSlots(response.data?.slots || [])
      } catch (requestError) {
        setSlots([])
        setError(
          requestError.response?.data?.message
          || 'Не удалось загрузить свободное время',
        )
      } finally {
        setIsLoadingSlots(false)
      }
    }

    loadSlots()
  }, [serviceId, masterId, date])

  const handleServiceChange = (event) => {
    const newServiceId = event.target.value
    const currentMaster = masters.find((master) => String(master.id) === String(masterId))

    setServiceId(newServiceId)
    if (currentMaster && !masterCanProvideService(currentMaster, newServiceId)) {
      setMasterId('')
    }
    setSlots([])
    setSelectedSlot(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedSlot) {
      setError('Выберите свободное время')
      return
    }

    if (!authUser) {
      setError('')
      setMessage('')
      openAuthModal()
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setMessage('')

      const response = await api.post(
        '/appointments',
        {
          serviceId,
          masterId,
          date,
          start_time: selectedSlot.start_time,
        },
      )

      setMessage('Запись создана')
      setSelectedSlot(null)
      setSlots((currentSlots) => currentSlots.filter(
        (slot) => slot.start_time !== response.data.appointment.start_time,
      ))
      onBooked?.(response.data.appointment)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'Не удалось создать запись',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="border border-neutral-200 bg-white p-4 text-neutral-950 sm:p-8">
      <div className="border-b border-neutral-200 pb-6">
        <p className="text-sm uppercase text-neutral-500">Онлайн-запись</p>
        <h2 className="mt-3 font-serif text-2xl font-normal sm:text-3xl">
          Выберите удобное время
        </h2>
      </div>

      <form className="mt-6 space-y-6 sm:mt-8 sm:space-y-7" onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-3">
          <label className="block text-sm text-neutral-700">
            Услуга
            <select
              className="mt-2 w-full rounded-sm border border-neutral-300 bg-white px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
              value={serviceId}
              onChange={handleServiceChange}
              disabled={isLoadingData}
            >
              <option value="">Выберите услугу</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {getServiceLabel(service)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-neutral-700">
            Мастер
            <select
              className="mt-2 w-full rounded-sm border border-neutral-300 bg-white px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950 disabled:bg-neutral-50 disabled:text-neutral-400"
              value={masterId}
              onChange={(event) => setMasterId(event.target.value)}
              disabled={!serviceId || isLoadingData}
            >
              <option value="">Выберите мастера</option>
              {availableMasters.map((master) => (
                <option key={master.id} value={master.id}>
                  {getMasterName(master)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-neutral-700">
            Дата
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 bg-white px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950 disabled:bg-neutral-50 disabled:text-neutral-400"
              type="date"
              min={getToday()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={!masterId}
            />
          </label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm text-neutral-700">Свободные слоты</p>
            {isLoadingSlots && (
              <p className="text-sm text-neutral-500">Загрузка...</p>
            )}
          </div>

          <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:max-h-none sm:grid-cols-3 sm:overflow-visible sm:pr-0 lg:grid-cols-4">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.start_time === slot.start_time

              return (
                <button
                  key={`${slot.start_time}-${slot.end_time}`}
                  type="button"
                  className={[
                    'min-h-11 rounded-sm border px-3 py-2 text-sm transition',
                    isSelected
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950',
                  ].join(' ')}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.label || slot.start_time}
                </button>
              )
            })}
          </div>

          {!isLoadingSlots && serviceId && masterId && date && slots.length === 0 && (
            <p className="border border-neutral-200 px-4 py-4 text-sm text-neutral-500">
              На выбранную дату свободных слотов нет.
            </p>
          )}
        </div>

        {error && (
          <p className="border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            {error}
          </p>
        )}

        {message && (
          <p className="border border-neutral-950 bg-white px-4 py-3 text-sm text-neutral-950">
            {message}
          </p>
        )}

        <Button
          type="submit"
          disabled={!selectedSlot || isSubmitting}
          className="w-full disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500 sm:w-auto"
        >
          {isSubmitting ? 'Записываем...' : 'Записаться'}
        </Button>
      </form>
    </section>
  )
}

export default BookingWidget

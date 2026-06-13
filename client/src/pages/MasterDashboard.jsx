import { useEffect, useState } from 'react'
import Button from '../components/Button'
import api from '../utils/api'

const statusLabels = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
}

const getClientName = (appointment) => (
  appointment.client?.name || `Клиент #${appointment.clientId}`
)

const getStatusLabel = (status) => statusLabels[status] || status || '-'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="max-w-[65%] text-right text-sm text-neutral-800">{value || '-'}</span>
    </div>
  )
}

function MasterDashboard() {
  const [period, setPeriod] = useState('today')
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await api.get('/appointments/me', {
          params: { period },
        })

        setAppointments(response.data.appointments || [])
      } catch (requestError) {
        setError(
          requestError.response?.data?.message
          || 'Не удалось загрузить записи',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [period])

  const updateStatus = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId)
      setError('')

      const response = await api.patch(
        `/appointments/${appointmentId}/status`,
        { status },
      )

      setAppointments((currentAppointments) => currentAppointments.map(
        (appointment) => (
          appointment.id === appointmentId
            ? { ...appointment, status: response.data.appointment.status }
            : appointment
        ),
      ))
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'Не удалось обновить статус',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const renderActions = (appointment) => {
    const isUpdating = updatingId === appointment.id

    if (appointment.status === 'PENDING') {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-9 px-3 py-1.5"
            disabled={isUpdating}
            onClick={() => updateStatus(appointment.id, 'CONFIRMED')}
          >
            Принять
          </Button>
          <Button
            variant="transparent"
            className="min-h-9 px-3 py-1.5"
            disabled={isUpdating}
            onClick={() => updateStatus(appointment.id, 'CANCELLED')}
          >
            Отклонить
          </Button>
        </div>
      )
    }

    if (appointment.status === 'CONFIRMED') {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-9 px-3 py-1.5"
            disabled={isUpdating}
            onClick={() => updateStatus(appointment.id, 'COMPLETED')}
          >
            Завершить
          </Button>
          <Button
            variant="transparent"
            className="min-h-9 px-3 py-1.5"
            disabled={isUpdating}
            onClick={() => updateStatus(appointment.id, 'CANCELLED')}
          >
            Отменить
          </Button>
        </div>
      )
    }

    return <span className="text-neutral-400">Нет действий</span>
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 text-neutral-950 sm:px-8 sm:py-16 lg:px-12">
      <div className="flex flex-col gap-6 border-b border-neutral-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase text-neutral-500">Панель мастера</p>
          <h1 className="mt-3 font-serif text-4xl font-normal sm:text-5xl">Мои записи</h1>
        </div>

        <select
          className="w-full rounded-sm border border-neutral-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-neutral-950 lg:w-56"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          <option value="today">Сегодня</option>
          <option value="week">Неделя</option>
        </select>
      </div>

      {error && (
        <p className="mt-6 border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {error}
        </p>
      )}

      {!isLoading && appointments.length === 0 && (
        <p className="mt-8 border border-neutral-200 px-4 py-8 text-sm text-neutral-500">
          Записей нет.
        </p>
      )}

      {appointments.length > 0 && (
        <>
          <div className="mt-8 grid gap-4 md:hidden">
            {appointments.map((appointment) => (
              <article key={appointment.id} className="border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-400">Запись</p>
                    <h2 className="mt-1 font-serif text-2xl">
                      {appointment.service?.name || '-'}
                    </h2>
                  </div>
                  <span className="shrink-0 border border-neutral-200 px-2 py-1 text-xs text-neutral-600">
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
                <div className="mt-4">
                  <InfoRow label="Дата" value={appointment.date} />
                  <InfoRow label="Время" value={`${appointment.start_time} - ${appointment.end_time}`} />
                  <InfoRow label="Клиент" value={getClientName(appointment)} />
                </div>
                <div className="mt-4">{renderActions(appointment)}</div>
              </article>
            ))}
          </div>

          <div className="mt-8 hidden overflow-x-auto border border-neutral-200 md:block">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Дата</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Время</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Клиент</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Услуга</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Статус</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-neutral-100">
                    <td className="px-4 py-4">{appointment.date}</td>
                    <td className="px-4 py-4">
                      {appointment.start_time} - {appointment.end_time}
                    </td>
                    <td className="px-4 py-4">{getClientName(appointment)}</td>
                    <td className="px-4 py-4">{appointment.service?.name || '-'}</td>
                    <td className="px-4 py-4">{getStatusLabel(appointment.status)}</td>
                    <td className="px-4 py-4">{renderActions(appointment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isLoading && (
        <p className="mt-4 text-sm text-neutral-500">Загрузка записей...</p>
      )}
    </section>
  )
}

export default MasterDashboard

import { useEffect, useState } from 'react'
import Button from '../components/Button'
import api from '../utils/api'

const statusLabels = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
}

const cancellableStatuses = ['PENDING', 'CONFIRMED']

const getStatusLabel = (status) => statusLabels[status] || status || '-'

const getMasterName = (appointment) => (
  appointment.master?.user?.name || `Мастер #${appointment.masterProfileId}`
)

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="max-w-[65%] text-right text-sm text-neutral-800">{value || '-'}</span>
    </div>
  )
}

function History() {
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await api.get('/appointments/client/me')

        setAppointments(response.data.appointments || [])
      } catch (requestError) {
        setError(
          requestError.response?.data?.message
          || 'Не удалось загрузить ваши записи',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [])

  const cancelAppointment = async (appointmentId) => {
    try {
      setCancelingId(appointmentId)
      setError('')

      const response = await api.patch(
        `/appointments/${appointmentId}/status`,
        { status: 'CANCELLED' },
      )
      const nextStatus = response.data?.appointment?.status || 'CANCELLED'

      setAppointments((currentAppointments) => currentAppointments.map(
        (appointment) => (
          appointment.id === appointmentId
            ? { ...appointment, status: nextStatus }
            : appointment
        ),
      ))
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'Не удалось отменить запись',
      )
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 text-neutral-950 sm:px-8 sm:py-16 lg:px-12">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">История</p>
          <h1 className="mt-4 font-serif text-4xl font-normal sm:text-5xl">
            Мои записи
          </h1>
        </div>
        {isLoading && (
          <p className="text-sm text-neutral-500">Загрузка записей...</p>
        )}
      </div>

      {error && (
        <p className="mt-6 border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {error}
        </p>
      )}

      {!isLoading && !error && appointments.length === 0 && (
        <p className="mt-8 border border-neutral-200 px-4 py-8 text-sm text-neutral-500">
          У вас пока нет записей
        </p>
      )}

      {!error && appointments.length > 0 && (
        <>
          <div className="mt-8 grid gap-4 md:hidden">
            {appointments.map((appointment) => {
              const canCancel = cancellableStatuses.includes(appointment.status)

              return (
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
                    <InfoRow label="Мастер" value={getMasterName(appointment)} />
                  </div>
                  <div className="mt-4">
                    {canCancel ? (
                      <Button
                        variant="transparent"
                        className="w-full disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
                        disabled={cancelingId === appointment.id}
                        onClick={() => cancelAppointment(appointment.id)}
                      >
                        {cancelingId === appointment.id ? 'Отмена...' : 'Отменить'}
                      </Button>
                    ) : (
                      <span className="text-sm text-neutral-400">Действий нет</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-8 hidden overflow-x-auto border border-neutral-200 md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Дата</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Время</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Услуга</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Мастер</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Статус</th>
                  <th className="border-b border-neutral-200 px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const canCancel = cancellableStatuses.includes(appointment.status)

                  return (
                    <tr key={appointment.id} className="border-b border-neutral-100">
                      <td className="px-4 py-4">{appointment.date}</td>
                      <td className="px-4 py-4">
                        {appointment.start_time} - {appointment.end_time}
                      </td>
                      <td className="px-4 py-4">{appointment.service?.name || '-'}</td>
                      <td className="px-4 py-4">{getMasterName(appointment)}</td>
                      <td className="px-4 py-4">{getStatusLabel(appointment.status)}</td>
                      <td className="px-4 py-4">
                        {canCancel ? (
                          <Button
                            variant="transparent"
                            className="min-h-9 px-3 py-1.5 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
                            disabled={cancelingId === appointment.id}
                            onClick={() => cancelAppointment(appointment.id)}
                          >
                            {cancelingId === appointment.id ? 'Отмена...' : 'Отменить'}
                          </Button>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export default History

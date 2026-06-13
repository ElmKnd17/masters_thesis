import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import api from '../utils/api'

const tabs = [
  { id: 'appointments', label: 'Заявки' },
  { id: 'schedule', label: 'Расписание' },
  { id: 'masters', label: 'Мастера' },
  { id: 'services', label: 'Услуги' },
]

const initialServiceForm = { name: '', price: '', duration: '' }
const initialMasterForm = {
  userId: '',
  experience: '',
  specialization: '',
  photo_url: '',
  serviceIds: [],
}
const initialScheduleForm = {
  masterId: '',
  date: '',
  start_time: '10:00',
  end_time: '18:00',
}

const statusLabels = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
}

const isPositiveNumber = (value) => (
  value !== '' && Number.isFinite(Number(value)) && Number(value) > 0
)

const isNonNegativeNumber = (value) => (
  value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
)

const getUserLabel = (user) => `${user.name || user.email} (${user.role})`
const getMasterLabel = (master) => master.user?.name || `Мастер #${master.id}`
const getStatusLabel = (status) => statusLabels[status] || status || '-'

const getScheduleRows = (masters) => masters.flatMap((master) => {
  const schedule = Array.isArray(master.schedule) ? master.schedule : []

  return schedule.map((slot) => ({
    id: slot.id,
    rowKey: `${master.id}-${slot.id}`,
    masterName: getMasterLabel(master),
    date: slot.date,
    start_time: slot.start_time,
    end_time: slot.end_time,
  }))
})

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="max-w-[65%] text-right text-sm text-neutral-800">{value || '-'}</span>
    </div>
  )
}

function EmptyState({ children }) {
  return (
    <p className="mt-5 border border-neutral-200 px-4 py-8 text-sm text-neutral-500">
      {children}
    </p>
  )
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('appointments')
  const [users, setUsers] = useState([])
  const [services, setServices] = useState([])
  const [masters, setMasters] = useState([])
  const [appointments, setAppointments] = useState([])
  const [serviceForm, setServiceForm] = useState(initialServiceForm)
  const [masterForm, setMasterForm] = useState(initialMasterForm)
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm)
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [editingMasterId, setEditingMasterId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const availableMasterUsers = useMemo(() => {
    const usedUserIds = new Set(
      masters
        .filter((master) => master.id !== editingMasterId)
        .map((master) => master.user?.id || master.userId),
    )

    return users.filter((user) => !usedUserIds.has(user.id))
  }, [editingMasterId, masters, users])

  const scheduleRows = useMemo(() => getScheduleRows(masters), [masters])

  const isServiceFormValid = (
    serviceForm.name.trim()
    && isPositiveNumber(serviceForm.price)
    && isPositiveNumber(serviceForm.duration)
  )

  const isMasterFormValid = (
    masterForm.userId
    && masterForm.specialization.trim()
    && isNonNegativeNumber(masterForm.experience)
  )

  const isScheduleFormValid = (
    scheduleForm.masterId
    && scheduleForm.date
    && scheduleForm.start_time
    && scheduleForm.end_time
  )

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const [
        usersResponse,
        servicesResponse,
        mastersResponse,
        appointmentsResponse,
      ] = await Promise.all([
        api.get('/users'),
        api.get('/services'),
        api.get('/masters'),
        api.get('/appointments'),
      ])

      setUsers(usersResponse.data || [])
      setServices(servicesResponse.data || [])
      setMasters(mastersResponse.data || [])
      setAppointments(appointmentsResponse.data.appointments || appointmentsResponse.data || [])
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'Не удалось загрузить данные панели',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDashboard()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  const resetServiceForm = () => {
    setServiceForm(initialServiceForm)
    setEditingServiceId(null)
  }

  const resetMasterForm = () => {
    setMasterForm(initialMasterForm)
    setEditingMasterId(null)
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setMessage('')
    setError('')
  }

  const handleMasterServiceToggle = (serviceId) => {
    setMasterForm((currentForm) => {
      const hasService = currentForm.serviceIds.includes(serviceId)

      return {
        ...currentForm,
        serviceIds: hasService
          ? currentForm.serviceIds.filter((id) => id !== serviceId)
          : [...currentForm.serviceIds, serviceId],
      }
    })
  }

  const startServiceEdit = (service) => {
    setEditingServiceId(service.id)
    setServiceForm({
      name: service.name || '',
      price: service.price || '',
      duration: service.duration || '',
    })
    setActiveTab('services')
    setMessage('')
    setError('')
  }

  const startMasterEdit = (master) => {
    setEditingMasterId(master.id)
    setMasterForm({
      userId: String(master.user?.id || master.userId || ''),
      experience: master.experience ?? '',
      specialization: master.specialization || '',
      photo_url: master.photo_url || '',
      serviceIds: (master.services || []).map((service) => String(service.id)),
    })
    setActiveTab('masters')
    setMessage('')
    setError('')
  }

  const submitService = async (event) => {
    event.preventDefault()

    if (!isServiceFormValid) {
      setError('Заполните название услуги, цену и длительность корректными числами')
      return
    }

    try {
      setError('')
      setMessage('')

      const payload = {
        name: serviceForm.name.trim(),
        price: Number(serviceForm.price),
        duration: Number(serviceForm.duration),
      }

      if (editingServiceId) {
        await api.put(`/services/${editingServiceId}`, payload)
        setMessage('Услуга обновлена')
      } else {
        await api.post('/services', payload)
        setMessage('Услуга добавлена')
      }

      resetServiceForm()
      await loadDashboard()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || (editingServiceId ? 'Не удалось обновить услугу' : 'Не удалось добавить услугу'),
      )
    }
  }

  const deleteService = async (serviceId) => {
    try {
      setError('')
      setMessage('')

      await api.delete(`/services/${serviceId}`)
      if (editingServiceId === serviceId) resetServiceForm()
      setMessage('Услуга удалена')
      await loadDashboard()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Не удалось удалить услугу')
    }
  }

  const submitMaster = async (event) => {
    event.preventDefault()

    if (!isMasterFormValid) {
      setError('Выберите пользователя, укажите специализацию и числовой опыт')
      return
    }

    try {
      setError('')
      setMessage('')

      const payload = {
        experience: Number(masterForm.experience),
        specialization: masterForm.specialization.trim(),
        photo_url: masterForm.photo_url.trim() || null,
        serviceIds: masterForm.serviceIds.map(Number),
      }

      if (editingMasterId) {
        await api.put(`/masters/${editingMasterId}`, payload)
        setMessage('Мастер обновлен')
      } else {
        await api.post('/masters', {
          ...payload,
          userId: Number(masterForm.userId),
        })
        setMessage('Мастер добавлен')
      }

      resetMasterForm()
      await loadDashboard()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || (editingMasterId ? 'Не удалось обновить мастера' : 'Не удалось добавить мастера'),
      )
    }
  }

  const deleteMaster = async (masterId) => {
    try {
      setError('')
      setMessage('')

      await api.delete(`/masters/${masterId}`)
      if (editingMasterId === masterId) resetMasterForm()
      setMessage('Мастер удален')
      await loadDashboard()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Не удалось удалить мастера')
    }
  }

  const createSchedule = async (event) => {
    event.preventDefault()

    if (!isScheduleFormValid) {
      setError('Заполните мастера, дату и время расписания')
      return
    }

    try {
      setError('')
      setMessage('')

      const { masterId, ...payload } = scheduleForm

      await api.post(`/masters/${masterId}/schedule`, payload)
      setScheduleForm(initialScheduleForm)
      setMessage('Расписание добавлено')
      await loadDashboard()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Не удалось добавить расписание')
    }
  }

  const deleteSchedule = async (scheduleId) => {
    try {
      setError('')
      setMessage('')

      await api.delete(`/masters/schedule/${scheduleId}`)
      setMessage('Слот расписания удален')
      await loadDashboard()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Не удалось удалить слот расписания')
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 text-neutral-950 sm:px-8 sm:py-16 lg:px-12">
      <div className="border-b border-neutral-200 pb-8">
        <p className="text-sm uppercase text-neutral-500">Панель администратора</p>
        <h1 className="mt-3 font-serif text-4xl font-normal sm:text-5xl">
          Управление салоном
        </h1>
      </div>

      <nav className="mt-8 grid grid-cols-2 gap-2 border-b border-neutral-200 pb-4 sm:flex sm:flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className={[
                'min-h-11 border px-3 py-2 text-sm transition sm:px-4',
                isActive
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950',
              ].join(' ')}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {message && (
        <p className="mt-6 border border-neutral-950 px-4 py-3 text-sm">{message}</p>
      )}
      {error && (
        <p className="mt-6 border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        {activeTab === 'appointments' && (
          <section>
            <h2 className="font-serif text-2xl sm:text-3xl">Все заявки</h2>

            {!isLoading && appointments.length === 0 && (
              <EmptyState>Заявок пока нет.</EmptyState>
            )}

            {appointments.length > 0 && (
              <>
                <div className="mt-5 grid gap-4 md:hidden">
                  {appointments.map((appointment) => (
                    <article key={appointment.id} className="border border-neutral-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-neutral-400">Заявка</p>
                          <h3 className="mt-1 font-serif text-2xl">{appointment.service?.name || '-'}</h3>
                        </div>
                        <span className="shrink-0 border border-neutral-200 px-2 py-1 text-xs text-neutral-600">
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                      <div className="mt-4">
                        <InfoRow label="Дата" value={appointment.date} />
                        <InfoRow label="Время" value={`${appointment.start_time} - ${appointment.end_time}`} />
                        <InfoRow label="Клиент" value={appointment.client?.name} />
                        <InfoRow label="Мастер" value={appointment.master?.user?.name} />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 hidden overflow-x-auto border border-neutral-200 md:block">
                  <table className="w-full min-w-[840px] text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500">
                      <tr>
                        <th className="border-b border-neutral-200 px-4 py-3 font-medium">Дата</th>
                        <th className="border-b border-neutral-200 px-4 py-3 font-medium">Время</th>
                        <th className="border-b border-neutral-200 px-4 py-3 font-medium">Клиент</th>
                        <th className="border-b border-neutral-200 px-4 py-3 font-medium">Мастер</th>
                        <th className="border-b border-neutral-200 px-4 py-3 font-medium">Услуга</th>
                        <th className="border-b border-neutral-200 px-4 py-3 font-medium">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.id} className="border-b border-neutral-100">
                          <td className="px-4 py-4">{appointment.date}</td>
                          <td className="px-4 py-4">
                            {appointment.start_time} - {appointment.end_time}
                          </td>
                          <td className="px-4 py-4">{appointment.client?.name || '-'}</td>
                          <td className="px-4 py-4">{appointment.master?.user?.name || '-'}</td>
                          <td className="px-4 py-4">{appointment.service?.name || '-'}</td>
                          <td className="px-4 py-4">{getStatusLabel(appointment.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'schedule' && (
          <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <form className="border border-neutral-200 p-4 sm:p-5" onSubmit={createSchedule}>
              <h2 className="font-serif text-2xl">Расписание мастера</h2>
              <div className="mt-5 space-y-3">
                <select
                  className="w-full border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  value={scheduleForm.masterId}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, masterId: event.target.value })}
                  required
                >
                  <option value="">Выберите мастера</option>
                  {masters.map((master) => (
                    <option key={master.id} value={master.id}>
                      {getMasterLabel(master)}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  type="date"
                  value={scheduleForm.date}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, date: event.target.value })}
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(event) => setScheduleForm({ ...scheduleForm, start_time: event.target.value })}
                    required
                  />
                  <input
                    className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(event) => setScheduleForm({ ...scheduleForm, end_time: event.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500"
                  disabled={!isScheduleFormValid}
                >
                  Создать
                </Button>
              </div>
            </form>

            <section>
              <h2 className="font-serif text-2xl sm:text-3xl">Расписание мастеров</h2>

              {!isLoading && scheduleRows.length === 0 && (
                <EmptyState>Расписание пока не добавлено.</EmptyState>
              )}

              {scheduleRows.length > 0 && (
                <>
                  <div className="mt-5 grid gap-4 md:hidden">
                    {scheduleRows.map((slot) => (
                      <article key={slot.rowKey} className="border border-neutral-200 bg-white p-4">
                        <h3 className="font-serif text-2xl">{slot.masterName}</h3>
                        <div className="mt-4">
                          <InfoRow label="Дата" value={slot.date} />
                          <InfoRow label="Начало" value={slot.start_time} />
                          <InfoRow label="Конец" value={slot.end_time} />
                        </div>
                        <Button
                          variant="transparent"
                          className="mt-4 w-full"
                          onClick={() => deleteSchedule(slot.id)}
                        >
                          Удалить
                        </Button>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 hidden overflow-x-auto border border-neutral-200 md:block">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500">
                        <tr>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Мастер</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Дата</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Время начала</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Время конца</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleRows.map((slot) => (
                          <tr key={slot.rowKey} className="border-b border-neutral-100">
                            <td className="px-4 py-4">{slot.masterName}</td>
                            <td className="px-4 py-4">{slot.date}</td>
                            <td className="px-4 py-4">{slot.start_time}</td>
                            <td className="px-4 py-4">{slot.end_time}</td>
                            <td className="px-4 py-4">
                              <Button
                                variant="transparent"
                                className="min-h-9 px-3 py-1.5"
                                onClick={() => deleteSchedule(slot.id)}
                              >
                                Удалить
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </section>
        )}

        {activeTab === 'masters' && (
          <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <form className="border border-neutral-200 p-4 sm:p-5" onSubmit={submitMaster}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl">
                  {editingMasterId ? 'Редактировать мастера' : 'Добавить мастера'}
                </h2>
                {editingMasterId && (
                  <button
                    type="button"
                    className="text-sm text-neutral-500 transition hover:text-neutral-950"
                    onClick={resetMasterForm}
                  >
                    Отмена
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-3">
                <select
                  className="w-full border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-950 disabled:bg-neutral-50 disabled:text-neutral-400"
                  value={masterForm.userId}
                  onChange={(event) => setMasterForm({ ...masterForm, userId: event.target.value })}
                  disabled={Boolean(editingMasterId)}
                  required
                >
                  <option value="">Выберите пользователя</option>
                  {availableMasterUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserLabel(user)}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  min="0"
                  placeholder="Опыт, лет"
                  type="number"
                  value={masterForm.experience}
                  onChange={(event) => setMasterForm({ ...masterForm, experience: event.target.value })}
                  required
                />
                <input
                  className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  placeholder="Специализация"
                  value={masterForm.specialization}
                  onChange={(event) => setMasterForm({ ...masterForm, specialization: event.target.value })}
                  required
                />
                <input
                  className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  placeholder="Ссылка на фото (URL)"
                  type="url"
                  value={masterForm.photo_url}
                  onChange={(event) => setMasterForm({ ...masterForm, photo_url: event.target.value })}
                />

                <fieldset className="border border-neutral-200 p-3">
                  <legend className="px-1 text-sm text-neutral-500">Услуги мастера</legend>
                  <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <label
                          key={service.id}
                          className="flex items-center gap-3 text-sm text-neutral-700"
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-neutral-950"
                            checked={masterForm.serviceIds.includes(String(service.id))}
                            onChange={() => handleMasterServiceToggle(String(service.id))}
                          />
                          <span>{service.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">Сначала добавьте услуги.</p>
                    )}
                  </div>
                </fieldset>

                <Button
                  type="submit"
                  className="w-full disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500"
                  disabled={!isMasterFormValid}
                >
                  {editingMasterId ? 'Сохранить' : 'Добавить'}
                </Button>
              </div>
            </form>

            <section>
              <h2 className="font-serif text-2xl sm:text-3xl">Мастера</h2>

              {!isLoading && masters.length === 0 && (
                <EmptyState>Мастера пока не добавлены.</EmptyState>
              )}

              {masters.length > 0 && (
                <>
                  <div className="mt-5 grid gap-4 md:hidden">
                    {masters.map((master) => (
                      <article key={master.id} className="border border-neutral-200 bg-white p-4">
                        <h3 className="font-serif text-2xl">{getMasterLabel(master)}</h3>
                        <div className="mt-4">
                          <InfoRow label="Специализация" value={master.specialization} />
                          <InfoRow
                            label="Услуги"
                            value={(master.services || []).map((service) => service.name).join(', ') || '-'}
                          />
                          <InfoRow
                            label="Фото"
                            value={master.photo_url ? (
                              <a
                                className="border-b border-neutral-300 text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
                                href={master.photo_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Открыть
                              </a>
                            ) : '-'}
                          />
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <Button variant="transparent" onClick={() => startMasterEdit(master)}>
                            Редактировать
                          </Button>
                          <Button variant="transparent" onClick={() => deleteMaster(master.id)}>
                            Удалить
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 hidden overflow-x-auto border border-neutral-200 md:block">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500">
                        <tr>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Имя</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Специализация</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Услуги</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Фото</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masters.map((master) => (
                          <tr key={master.id} className="border-b border-neutral-100">
                            <td className="px-4 py-4">{getMasterLabel(master)}</td>
                            <td className="px-4 py-4">{master.specialization}</td>
                            <td className="px-4 py-4">
                              {(master.services || []).map((service) => service.name).join(', ') || '-'}
                            </td>
                            <td className="px-4 py-4">
                              {master.photo_url ? (
                                <a
                                  className="border-b border-neutral-300 text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
                                  href={master.photo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Открыть
                                </a>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="transparent"
                                  className="min-h-9 px-3 py-1.5"
                                  onClick={() => startMasterEdit(master)}
                                >
                                  Редактировать
                                </Button>
                                <Button
                                  variant="transparent"
                                  className="min-h-9 px-3 py-1.5"
                                  onClick={() => deleteMaster(master.id)}
                                >
                                  Удалить
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </section>
        )}

        {activeTab === 'services' && (
          <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <form className="border border-neutral-200 p-4 sm:p-5" onSubmit={submitService}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl">
                  {editingServiceId ? 'Редактировать услугу' : 'Добавить услугу'}
                </h2>
                {editingServiceId && (
                  <button
                    type="button"
                    className="text-sm text-neutral-500 transition hover:text-neutral-950"
                    onClick={resetServiceForm}
                  >
                    Отмена
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-3">
                <input
                  className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  placeholder="Название"
                  value={serviceForm.name}
                  onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                  required
                />
                <input
                  className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  min="0"
                  placeholder="Цена"
                  type="number"
                  value={serviceForm.price}
                  onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })}
                  required
                />
                <input
                  className="w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                  min="1"
                  placeholder="Длительность, мин"
                  type="number"
                  value={serviceForm.duration}
                  onChange={(event) => setServiceForm({ ...serviceForm, duration: event.target.value })}
                  required
                />
                <Button
                  type="submit"
                  className="w-full disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500"
                  disabled={!isServiceFormValid}
                >
                  {editingServiceId ? 'Сохранить' : 'Добавить'}
                </Button>
              </div>
            </form>

            <section>
              <h2 className="font-serif text-2xl sm:text-3xl">Услуги</h2>

              {!isLoading && services.length === 0 && (
                <EmptyState>Услуги пока не добавлены.</EmptyState>
              )}

              {services.length > 0 && (
                <>
                  <div className="mt-5 grid gap-4 md:hidden">
                    {services.map((service) => (
                      <article key={service.id} className="border border-neutral-200 bg-white p-4">
                        <h3 className="font-serif text-2xl">{service.name}</h3>
                        <div className="mt-4">
                          <InfoRow label="Цена" value={service.price} />
                          <InfoRow label="Мин" value={service.duration} />
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <Button variant="transparent" onClick={() => startServiceEdit(service)}>
                            Редактировать
                          </Button>
                          <Button variant="transparent" onClick={() => deleteService(service.id)}>
                            Удалить
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 hidden overflow-x-auto border border-neutral-200 md:block">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-500">
                        <tr>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Название</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Цена</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Мин</th>
                          <th className="border-b border-neutral-200 px-4 py-3 font-medium">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <tr key={service.id} className="border-b border-neutral-100">
                            <td className="px-4 py-4">{service.name}</td>
                            <td className="px-4 py-4">{service.price}</td>
                            <td className="px-4 py-4">{service.duration}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="transparent"
                                  className="min-h-9 px-3 py-1.5"
                                  onClick={() => startServiceEdit(service)}
                                >
                                  Редактировать
                                </Button>
                                <Button
                                  variant="transparent"
                                  className="min-h-9 px-3 py-1.5"
                                  onClick={() => deleteService(service.id)}
                                >
                                  Удалить
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </section>
        )}
      </div>

      {isLoading && <p className="mt-4 text-sm text-neutral-500">Загрузка...</p>}
    </section>
  )
}

export default AdminDashboard

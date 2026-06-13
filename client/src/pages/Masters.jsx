import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { useBooking } from '../context/BookingContext'
import api from '../utils/api'

const getMasterName = (master) => (
  master.user?.name || master.name || `Мастер #${master.id}`
)

const getExperienceLabel = (experience) => {
  if (experience === null || experience === undefined || experience === '') {
    return 'Опыт не указан'
  }

  return `Опыт работы: ${experience} лет`
}

function Masters() {
  const { openBooking } = useBooking()
  const [masters, setMasters] = useState([])
  const [selectedMaster, setSelectedMaster] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadMasters = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await api.get('/masters')
        setMasters(response.data || [])
      } catch (requestError) {
        setError(
          requestError.response?.data?.message
          || 'Не удалось загрузить мастеров',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadMasters()
  }, [])

  const openBookingFromDetails = () => {
    if (!selectedMaster) return

    const masterId = selectedMaster.id
    setSelectedMaster(null)
    openBooking({ masterId })
  }

  return (
    <div className="bg-white text-neutral-950">
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="border-b border-neutral-200 pb-10">
          <p className="text-sm uppercase text-neutral-500">Команда</p>
          <h1 className="mt-3 font-serif text-4xl font-normal sm:text-5xl">Мастера</h1>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
          {isLoading && (
            <div className="flex items-center gap-4 py-16 text-sm text-neutral-500">
              <span className="size-5 animate-spin rounded-full border border-neutral-300 border-t-neutral-950" />
              <span>Загрузка мастеров...</span>
            </div>
          )}

          {!isLoading && error && (
            <p className="border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700">
              {error}
            </p>
          )}

          {!isLoading && !error && masters.length === 0 && (
            <p className="py-16 text-sm text-neutral-500">Мастера пока не добавлены.</p>
          )}

          {!isLoading && !error && masters.length > 0 && (
            <div className="grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-10">
              {masters.map((master) => {
                const masterName = getMasterName(master)
                const services = Array.isArray(master.services) ? master.services : []
                const photoUrl = master.photo_url || master.user?.photo_url

                return (
                  <article
                    key={master.id}
                    className="group flex h-full flex-col border border-neutral-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg"
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={masterName}
                        className="aspect-[4/5] w-full shrink-0 object-cover grayscale transition duration-300 group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] w-full shrink-0 items-center justify-center bg-neutral-100 text-sm uppercase tracking-wide text-neutral-400">
                        Фото
                      </div>
                    )}

                    <div className="flex flex-1 flex-col gap-5 p-6">
                      <div>
                        <p className="text-sm text-neutral-500">
                          {master.specialization || 'Специализация не указана'}
                        </p>
                        <h2 className="mt-2 font-serif text-2xl text-neutral-950">
                          {masterName}
                        </h2>
                      </div>

                      <p className="min-h-12 text-sm leading-6 text-neutral-600">
                        {getExperienceLabel(master.experience)}
                      </p>

                      <div className="flex min-h-14 flex-wrap gap-2">
                        {services.length > 0 ? (
                          services.map((service) => (
                            <span
                              key={service.id}
                              className="border border-neutral-200 px-3 py-1 text-xs text-neutral-600"
                            >
                              {service.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-400">Услуги не указаны</span>
                        )}
                      </div>

                      <div className="mt-auto space-y-2 pt-4">
                        <Button
                          variant="transparent"
                          className="w-full"
                          onClick={() => setSelectedMaster(master)}
                        >
                          Подробнее
                        </Button>
                        <Button
                          className="w-full"
                          onClick={() => openBooking({ masterId: master.id })}
                        >
                          Записаться
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={Boolean(selectedMaster)}
        onClose={() => setSelectedMaster(null)}
        title={selectedMaster ? getMasterName(selectedMaster) : ''}
      >
        {selectedMaster && (
          <div className="space-y-5 text-sm leading-6 text-neutral-700">
            <p>{selectedMaster.specialization || 'Специализация не указана'}</p>
            <p>{getExperienceLabel(selectedMaster.experience)}</p>
            <div className="flex flex-wrap gap-2">
              {(selectedMaster.services || []).map((service) => (
                <span
                  key={service.id}
                  className="border border-neutral-200 px-3 py-1 text-neutral-600"
                >
                  {service.name}
                </span>
              ))}
            </div>
            <Button className="w-full" onClick={openBookingFromDetails}>
              Записаться
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Masters

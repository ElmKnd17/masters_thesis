import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { useBooking } from '../context/BookingContext'
import api from '../utils/api'
import heroImage from '../assets/salon/why.webp'

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return 'Цена уточняется'
  }

  const numericPrice = Number(price)

  if (Number.isNaN(numericPrice)) {
    return `${price} ₽`
  }

  return `${numericPrice.toLocaleString('ru-RU', {
    maximumFractionDigits: 0,
  })} ₽`
}

const getServiceLetter = (name = '') => name.trim().charAt(0).toUpperCase() || 'E'

const getServiceImage = (service) => service.image_url || service.image || ''

function Home() {
  const { openBooking } = useBooking()
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await api.get('/services')
        setServices(response.data || [])
      } catch (requestError) {
        setError(
          requestError.response?.data?.message
          || 'Не удалось загрузить услуги',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  return (
    <div className="bg-white text-neutral-950">
      <section className="group relative min-h-[min(640px,68svh)] overflow-hidden">
        <img
          src={heroImage}
          alt="Интерьер салона красоты"
          className="absolute inset-0 size-full object-cover grayscale transition duration-500 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-neutral-950/45" />
        <div className="relative mx-auto flex min-h-[min(640px,68svh)] max-w-7xl items-end px-5 py-16 sm:px-8 lg:px-12">
          <div className="max-w-3xl text-white">
            <p className="mb-5 text-sm uppercase">Салон красоты</p>
            <h1 className="font-serif text-4xl font-normal leading-none text-white sm:text-7xl">
              Евразель
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-100 sm:text-lg">
              Спокойная эстетика, точная работа с формой и сервис без лишнего
              шума. Стрижки, окрашивание, уходы, маникюр и макияж в одном
              пространстве.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button onClick={openBooking}>Записаться</Button>
              <Button
                to="/services"
                variant="transparent"
                className="border-white text-white hover:bg-white hover:text-neutral-950"
              >
                Смотреть услуги
              </Button>
              <Button
                to="/masters"
                variant="transparent"
                className="border-white text-white hover:bg-white hover:text-neutral-950"
              >
                Мастера
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-10 border-b border-neutral-200 pb-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm uppercase text-neutral-500">Основные услуги</p>
              <h2 className="mt-3 font-serif text-3xl font-normal text-neutral-950 sm:text-4xl">
                Подчеркнем вашу естественную красоту
              </h2>
            </div>
            <p className="max-w-3xl leading-7 text-neutral-600">
              Мы создали пространство, где забота о себе превращается в настоящее
              искусство. Доверьтесь нашим мастерам: от легкой укладки до сложного
              окрашивания — каждый штрих будет безупречен.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-4 py-16 text-sm text-neutral-500">
              <span className="size-5 animate-spin rounded-full border border-neutral-300 border-t-neutral-950" />
              <span>Загрузка услуг...</span>
            </div>
          )}

          {!isLoading && error && (
            <p className="mt-8 border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700">
              {error}
            </p>
          )}

          {!isLoading && !error && services.length === 0 && (
            <p className="py-16 text-sm text-neutral-500">Услуги пока не добавлены.</p>
          )}

          {!isLoading && !error && services.length > 0 && (
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const serviceImage = getServiceImage(service)

                return (
                  <article
                    key={service.id}
                    className="group flex min-h-[320px] flex-col border border-neutral-200/80 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg"
                  >
                    {serviceImage ? (
                      <img
                        src={serviceImage}
                        alt={service.name}
                        className="mb-8 aspect-[4/3] w-full object-cover grayscale transition duration-300 group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="mb-8 flex size-16 items-center justify-center bg-neutral-100 font-serif text-3xl text-neutral-500">
                        {getServiceLetter(service.name)}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                      <h3 className="font-serif text-2xl text-neutral-950">
                        {service.name}
                      </h3>
                      <span className="whitespace-nowrap text-sm text-neutral-500">
                        {formatPrice(service.price)}
                      </span>
                    </div>

                    <p className="mt-5 text-sm leading-6 text-neutral-600">
                      Длительность: {service.duration || '-'} мин
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2 pt-10">
                      <Button
                        to={`/services#service-${service.id}`}
                        variant="transparent"
                        className="w-full sm:w-fit"
                      >
                        Прайс
                      </Button>
                      <Button
                        onClick={() => openBooking({ serviceId: service.id })}
                        className="w-full sm:w-fit"
                      >
                        Записаться
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home

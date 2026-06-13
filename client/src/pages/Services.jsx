import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { useBooking } from '../context/BookingContext'
import api from '../utils/api'

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

function Services() {
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
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="border-b border-neutral-200 pb-10">
          <p className="text-sm uppercase text-neutral-500">Прайс-лист</p>
          <h1 className="mt-3 font-serif text-4xl font-normal sm:text-5xl">Услуги</h1>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
          {isLoading && (
            <div className="flex items-center gap-4 py-16 text-sm text-neutral-500">
              <span className="size-5 animate-spin rounded-full border border-neutral-300 border-t-neutral-950" />
              <span>Загрузка услуг...</span>
            </div>
          )}

          {!isLoading && error && (
            <p className="border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700">
              {error}
            </p>
          )}

          {!isLoading && !error && services.length === 0 && (
            <p className="py-16 text-sm text-neutral-500">Услуги пока не добавлены.</p>
          )}

          {!isLoading && !error && services.length > 0 && (
            <div className="grid gap-5">
              {services.map((service) => (
                <article
                  id={`service-${service.id}`}
                  key={service.id}
                  className="grid gap-8 border border-neutral-200/80 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg sm:p-7 lg:grid-cols-[0.75fr_1.25fr]"
                >
                  <div className="flex flex-col justify-between gap-8">
                    <div>
                      <p className="text-sm uppercase text-neutral-400">Услуга</p>
                      <h2 className="mt-3 font-serif text-2xl font-normal sm:text-3xl">
                        {service.name}
                      </h2>
                    </div>
                    <Button
                      onClick={() => openBooking({ serviceId: service.id })}
                      className="w-full sm:w-fit"
                    >
                      Записаться
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="border border-neutral-100 bg-neutral-50 p-5">
                      <p className="text-sm text-neutral-500">Стоимость</p>
                      <p className="mt-3 font-serif text-2xl text-neutral-950">
                        {formatPrice(service.price)}
                      </p>
                    </div>
                    <div className="border border-neutral-100 bg-neutral-50 p-5">
                      <p className="text-sm text-neutral-500">Длительность</p>
                      <p className="mt-3 font-serif text-2xl text-neutral-950">
                        {service.duration || '-'} мин
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !error && services.length > 0 && (
            <div className="mt-10 border-t border-neutral-200 pt-10">
              <Button onClick={openBooking} variant="transparent" className="w-full sm:w-fit">
                Записаться без выбора услуги
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Services

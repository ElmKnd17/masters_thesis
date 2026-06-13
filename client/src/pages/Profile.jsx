import { useState } from 'react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

function Profile() {
  const { authUser, updateAuthUser } = useAuth()
  const [form, setForm] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    photo_url: authUser?.photo_url || '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Введите имя')
      return
    }

    if (!form.email.trim()) {
      setError('Введите email')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setMessage('')

      const response = await api.put(
        '/user/profile',
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          photo_url: form.photo_url.trim() || null,
          password: form.password,
        },
      )

      const updatedUser = response.data?.user || response.data
      updateAuthUser(updatedUser)
      setForm({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        photo_url: updatedUser.photo_url || '',
        password: '',
      })
      setMessage('Профиль обновлен')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'Не удалось сохранить профиль',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-12 text-neutral-950 sm:px-8 sm:py-16 lg:px-12">
      <div className="border-b border-neutral-200 pb-10">
        <p className="text-sm uppercase text-neutral-500">Личный кабинет</p>
        <h1 className="mt-3 font-serif text-4xl font-normal sm:text-5xl">Профиль</h1>
      </div>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {form.photo_url ? (
            <img
              src={form.photo_url}
              alt={form.name || 'Аватар пользователя'}
              className="size-32 rounded-full border border-neutral-200 object-cover grayscale"
            />
          ) : (
            <div className="flex size-32 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-sm uppercase tracking-wide text-neutral-400">
              Фото
            </div>
          )}
        </div>

        <form className="w-full space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm text-neutral-700">
            Имя
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ваше имя"
              autoComplete="name"
              required
            />
          </label>

          <label className="block text-sm text-neutral-700">
            Email
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="client@example.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="block text-sm text-neutral-700">
            Телефон
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+7 900 000 00 00"
              autoComplete="tel"
            />
          </label>

          <label className="block text-sm text-neutral-700">
            Ссылка на фото
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
              type="url"
              name="photo_url"
              value={form.photo_url}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg"
            />
          </label>

          <label className="block text-sm text-neutral-700">
            Новый пароль
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Оставьте пустым, если не меняете"
              autoComplete="new-password"
              minLength={6}
            />
          </label>

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
            disabled={isSubmitting || !form.name.trim() || !form.email.trim()}
            className="w-full disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500 sm:w-fit"
          >
            {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          </Button>
        </form>
      </div>
    </section>
  )
}

export default Profile

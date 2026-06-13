import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Button from './Button'
import Modal from './Modal'
import Notifications from './Notifications'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Главная' },
  { to: '/services', label: 'Услуги' },
  { to: '/masters', label: 'Мастера' },
]

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getDashboard = (role) => {
  if (role === 'ADMIN') {
    return { path: '/admin', label: 'Панель админа' }
  }

  if (role === 'MASTER') {
    return { path: '/master', label: 'Панель мастера' }
  }

  return null
}

const getAvatarLetter = (user) => (
  user?.name?.trim().charAt(0).toUpperCase()
  || user?.email?.trim().charAt(0).toUpperCase()
  || 'E'
)

function Navbar() {
  const {
    authUser,
    login,
    logout,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isRegisterMode = authMode === 'register'
  const dashboard = getDashboard(authUser?.role)

  const getLinkClass = ({ isActive }) => [
    'border-b py-1 text-sm transition',
    isActive
      ? 'border-neutral-950 text-neutral-950'
      : 'border-transparent text-neutral-500 hover:text-neutral-950',
  ].join(' ')

  const getAvatarClass = ({ isActive }) => [
    'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
    isActive
      ? 'border-neutral-950 bg-neutral-950 text-white'
      : 'border-neutral-200 bg-neutral-100 text-neutral-600 hover:border-neutral-950 hover:text-neutral-950',
  ].join(' ')

  const resetAuthForm = () => {
    setAuthMode('login')
    setForm(initialForm)
    setError('')
  }

  const handleOpenAuthModal = () => {
    resetAuthForm()
    openAuthModal()
  }

  const handleCloseAuthModal = () => {
    resetAuthForm()
    closeAuthModal()
  }

  const switchMode = (mode) => {
    setAuthMode(mode)
    setForm(initialForm)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const email = form.email.trim()
    const password = form.password.trim()

    if (isRegisterMode && !form.name.trim()) {
      return 'Введите имя'
    }

    if (!emailRegex.test(email)) {
      return 'Введите корректный email'
    }

    if (isRegisterMode && !form.phone.trim()) {
      return 'Введите телефон'
    }

    if (password.length < 6) {
      return 'Пароль должен быть не короче 6 символов'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const endpoint = isRegisterMode ? '/user/registration' : '/user/login'
      const payload = isRegisterMode
        ? {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }
        : {
          email: form.email.trim(),
          password: form.password,
        }

      const response = await api.post(endpoint, payload)

      if (!response.data?.user) {
        throw new Error('Сервер не вернул данные пользователя')
      }

      login(response.data.user)
      resetAuthForm()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || requestError.message
        || 'Не удалось выполнить авторизацию',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="font-serif text-2xl text-neutral-950">
              Евразель
            </NavLink>
            <Notifications />
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:justify-end">
            <nav className="flex items-center gap-5">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={getLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {authUser ? (
              <div className="flex flex-wrap items-center gap-3">
                <NavLink to="/history" className={getLinkClass}>
                  Мои записи
                </NavLink>
                {dashboard && (
                  <NavLink to={dashboard.path} className={getLinkClass}>
                    {dashboard.label}
                  </NavLink>
                )}
                <Button
                  variant="transparent"
                  className="min-h-10 px-4 py-2"
                  onClick={logout}
                >
                  Выйти
                </Button>
                <NavLink
                  to="/profile"
                  className={getAvatarClass}
                  aria-label="Профиль"
                  title="Профиль"
                >
                  {authUser.photo_url ? (
                    <img
                      src={authUser.photo_url}
                      alt={authUser.name || 'Профиль'}
                      className="size-full object-cover grayscale"
                    />
                  ) : (
                    <span>{getAvatarLetter(authUser)}</span>
                  )}
                </NavLink>
              </div>
            ) : (
              <Button
                variant="transparent"
                className="min-h-10 px-4 py-2"
                onClick={handleOpenAuthModal}
              >
                Вход
              </Button>
            )}
          </div>
        </div>
      </header>

      <Modal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        title={isRegisterMode ? 'Регистрация' : 'Вход'}
      >
        <div className="mb-6 grid grid-cols-2 border border-neutral-200 text-sm">
          <button
            type="button"
            className={[
              'px-4 py-3 transition',
              !isRegisterMode
                ? 'bg-neutral-950 text-white'
                : 'bg-white text-neutral-600 hover:text-neutral-950',
            ].join(' ')}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={[
              'px-4 py-3 transition',
              isRegisterMode
                ? 'bg-neutral-950 text-white'
                : 'bg-white text-neutral-600 hover:text-neutral-950',
            ].join(' ')}
            onClick={() => switchMode('register')}
          >
            Регистрация
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <label className="block text-sm text-neutral-700">
              Имя
              <input
                className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-2 text-neutral-950 outline-none transition focus:border-neutral-950"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Анна"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="block text-sm text-neutral-700">
            Email
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-2 text-neutral-950 outline-none transition focus:border-neutral-950"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="client@example.com"
                autoComplete="username"
                required
              />
          </label>

          {isRegisterMode && (
            <label className="block text-sm text-neutral-700">
              Телефон
              <input
                className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-2 text-neutral-950 outline-none transition focus:border-neutral-950"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+7 900 000 00 00"
                autoComplete="tel"
                required
              />
            </label>
          )}

          <label className="block text-sm text-neutral-700">
            Пароль
            <input
              className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-2 text-neutral-950 outline-none transition focus:border-neutral-950"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {error && (
            <p className="border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Отправка...'
              : isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
          </Button>
        </form>
      </Modal>
    </>
  )
}

export default Navbar

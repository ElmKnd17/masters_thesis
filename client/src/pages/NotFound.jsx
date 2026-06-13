import Button from '../components/Button'

function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-5 py-16 text-neutral-950 sm:px-8 lg:px-12">
      <p className="text-sm uppercase text-neutral-500">404</p>
      <h1 className="mt-3 font-serif text-4xl font-normal sm:text-5xl">Страница не найдена</h1>
      <div className="mt-8">
        <Button to="/" variant="transparent">
          На главную
        </Button>
      </div>
    </section>
  )
}

export default NotFound

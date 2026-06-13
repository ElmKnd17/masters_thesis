function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-neutral-600 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-12">
        <div>
          <p className="font-serif text-2xl text-neutral-950">Евразель</p>
          <p className="mt-3 max-w-sm leading-6">
            Салон красоты с вниманием к форме, качеству и спокойному сервису.
          </p>
        </div>

        <address className="not-italic leading-7">
          <p>Тольятти, Самарская область</p>
          <a className="block transition hover:text-neutral-950" href="tel:+79277777777">
            +7 927 777 77 77
          </a>
          <a
            className="block transition hover:text-neutral-950"
            href="mailto:EvrAzEl@gmail.com"
          >
            EvrAzEl@gmail.com
          </a>
        </address>

        <div className="flex items-end justify-between gap-6 lg:flex-col lg:items-start lg:justify-start">
          <p>© 2026</p>
          <p className="text-neutral-500">Beauty salon</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

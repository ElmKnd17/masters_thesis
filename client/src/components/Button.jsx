import { Link } from 'react-router-dom'

const variants = {
  black: 'border-neutral-950 bg-neutral-950 text-white hover:bg-white hover:text-neutral-950',
  transparent: 'border-neutral-300 bg-transparent text-neutral-950 hover:border-neutral-950',
}

function Button({
  children,
  variant = 'black',
  className = '',
  type = 'button',
  to,
  ...props
}) {
  const classes = [
    'inline-flex min-h-11 items-center justify-center rounded-sm border px-5 py-2.5 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
    variants[variant] || variants.black,
    className,
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button

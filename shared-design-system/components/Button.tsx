import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

export type ButtonVariant = 'default' | 'primary' | 'icon'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export function Button({
  variant = 'default',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const classes = ['ds-button', `ds-button--${variant}`, className]
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={classes} {...rest} />
}

import type { InputHTMLAttributes, ReactNode } from 'react'
import './Checkbox.css'

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: ReactNode
}

export function Checkbox({ label, ...rest }: CheckboxProps) {
  return (
    <label className="ds-checkbox">
      <input type="checkbox" {...rest} />
      {label}
    </label>
  )
}

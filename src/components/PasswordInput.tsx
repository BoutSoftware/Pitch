import { Button } from '@heroui/button';
import { Input, InputProps } from '@heroui/input'
import React from 'react'

export default function PasswordInput({ value, label, ...props }: { value: string, label: string, } & InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Input
      label={label}
      value={value}
      {...props}
      type={showPassword ? "text" : "password"}
      endContent={
        <Button variant="ghost" size="sm" onPress={() => setShowPassword(!showPassword)} isIconOnly>
          <span className="material-symbols-outlined icon-sm">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </Button>
      }
    />
  )
}

"use client";

import { ThemeContext } from 'bout-themes';
import React, { useContext } from 'react'
import { Switch, SwitchProps } from "@heroui/switch";

export default function ThemeSwitch(props?: SwitchProps) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <Switch
      isSelected={theme === 'dark'}
      onChange={toggleTheme}
      size={props?.size || 'md'}
      color={props?.color || 'primary'}
      thumbIcon={({ isSelected, className }) =>
        <span className={"material-symbols-outlined icon-sm" + " " + className}>
          {isSelected ? 'dark_mode' : 'light_mode'}
        </span>
      }
      {...props}
    />
  )
}

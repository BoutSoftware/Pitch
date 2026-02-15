"use client";

import { Button } from '@heroui/button';
import { Listbox, ListboxProps } from '@heroui/listbox'
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react'

interface SideBarProps {
  sidebarId: string
  children: ListboxProps["children"]
  ariaLabel: ListboxProps["aria-label"]
  isVisible?: boolean
  excludedPaths?: RegExp[]
  topContent?: ListboxProps["topContent"]
  bottomContent?: ListboxProps["bottomContent"]
  onAction?: ListboxProps["onAction"]
}

export default function SideBar(props: SideBarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(true)

  const handleSidebarToggle = () => {
    setIsOpen(!isOpen)
    localStorage.setItem(props.sidebarId, JSON.stringify(!isOpen))
  }

  // UseEffect to store and retrieve the desired sidebar state from local storage
  useEffect(() => {
    const storedState = localStorage.getItem(props.sidebarId)
    if (storedState) {
      setIsOpen(JSON.parse(storedState))
    }
  }, [])

  return (!props.excludedPaths?.some(path => path.test(pathname))) && (
    <Listbox
      color='primary'
      variant='flat'
      className={`max-w-64 py-4 px-2 bg-content2 relative overflow-visible transition-all ${isOpen ? 'w-full' : 'w-4 hide-children'} ${props.isVisible ? '' : 'hidden'}`}
      aria-label={props.ariaLabel}
      onAction={props.onAction}
      topContent={<>
        {props.topContent}
        <Button
          variant='solid'
          color='primary'
          onPress={handleSidebarToggle}
          className={'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 min-w-0 !flex'}
          isIconOnly
          size='sm'
        >
          <span className='material-symbols-outlined'>drag_indicator</span>
        </Button>
      </>}
      bottomContent={props.bottomContent}
    >
      {props.children}
    </Listbox>
  )
}

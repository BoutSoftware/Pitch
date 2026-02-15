import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header({ startUrl = '/', navigation }: { startUrl?: string, navigation?: React.ReactNode }) {
  return (
    <div
      className='px-4 py-3 flex justify-between items-center bg-content1 text-content1-foreground shadow-md h-16 sticky top-0 z-50 acrilic'
    >
      {/* Logo */}
      <Link className='flex items-center space-x-2' href={startUrl}>
        <Image src='/logo.svg' alt='Logo' className='h-8' />
        <span className='text-xl font-semibold block'>Pitch</span>
      </Link>

      {/* Credits */}
      {/* <BoutCredits /> */}

      {/* Navigation */}
      {navigation}
    </div>
  )
}


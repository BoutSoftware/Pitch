import React from 'react'

type Size = 'sm' | 'md' | 'lg'

const sizeMap: Record<Size, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

function Star({
  filled,
  half,
  size = 'md',
}: {
  filled: boolean
  half?: boolean
  size?: Size
}) {
  const starPath =
    'M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z'

  return (
    <svg
      className={`${sizeMap[size]} ${filled ? 'text-amber-300' : half ? 'text-amber-300' : 'text-gray-500'}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 22 20"
      fill="currentColor"
    >
      {half ? (
        <>
          <defs>
            <linearGradient id="half-grad">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="lightgray" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={starPath} fill="url(#half-grad)" />
        </>
      ) : (
        <path d={starPath} fill="currentColor" />
      )}
    </svg>
  )
}

export default function Rating({
  rating,
  className,
  size = 'md',
}: {
  rating: number
  className?: string
  size?: Size
}) {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5')
  }

  return (
    <div
      className={`flex items-center space-x-1 text-sm ${className}`}
      aria-label={`Rating: ${rating} out of 5`}
    >
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1
        if (rating >= starValue) {
          return <Star key={index} filled size={size} />
        } else if (rating >= starValue - 0.5) {
          return <Star key={index} filled={false} half size={size} />
        } else {
          return <Star key={index} filled={false} size={size} />
        }
      })}
    </div>
  )
}

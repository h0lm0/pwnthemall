import { useState } from 'react'

interface ChallengeImageProps {
  readonly challengeId: number
  readonly alt: string
  readonly className?: string
  readonly priority?: boolean
}

/**
 * ChallengeImage - Displays a challenge cover image with error handling
 * 
 * Features:
 * - Loads image from backend API endpoint
 * - Graceful degradation if image fails to load
 * - Responsive with aspect-video ratio
 * - Loading skeleton during fetch
 */
export default function ChallengeImage({ challengeId, alt, className = '', priority = false }: ChallengeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // If image failed to load, don't render anything
  if (imageError) {
    return null
  }

  const imageUrl = `/api/challenges/${challengeId}/cover`

  return (
    <div className={`relative w-full aspect-video overflow-hidden bg-muted ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted/50" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  )
}

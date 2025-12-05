import { useState } from 'react'

interface ChallengeImageProps {
  readonly challengeId: number
  readonly alt: string
  readonly className?: string
  readonly priority?: boolean
  readonly positionX?: number  // 0-100, default 50 (center)
  readonly positionY?: number  // 0-100, default 50 (center)
}

/**
 * ChallengeImage - Displays a challenge cover image with error handling
 * 
 * Features:
 * - Loads image from backend API endpoint
 * - Graceful degradation if image fails to load
 * - Responsive with aspect-video ratio
 * - Loading skeleton during fetch
 * - Configurable focal point via positionX/positionY
 */
export default function ChallengeImage({ 
  challengeId, 
  alt, 
  className = '', 
  priority = false,
  positionX = 50,
  positionY = 50
}: ChallengeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // If image failed to load, don't render anything
  if (imageError) {
    return null
  }

  const imageUrl = `/api/challenges/${challengeId}/cover`
  
  // Compute object-position from x/y percentages
  const objectPosition = `${positionX}% ${positionY}%`

  return (
    <div className={`relative w-full aspect-video overflow-hidden bg-muted ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted/50" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ objectPosition }}
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

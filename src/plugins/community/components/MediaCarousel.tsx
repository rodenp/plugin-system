import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AttachmentDownloadModal } from './AttachmentDownloadModal'

interface MediaItem {
  id: string
  type: 'attachment' | 'video' | 'gif' | 'poll'
  data: any
}

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  preview: string
}

interface MediaCarouselProps {
  attachments?: Attachment[]
  videoUrl?: string
  pollData?: { options: string[], votes?: number[] }
  content?: string
  theme: any
  compact?: boolean
  showCloseButton?: boolean
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ 
  attachments = [],
  videoUrl,
  pollData,
  content = '',
  theme,
  compact = false,
  showCloseButton = true
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false)
  const [downloadAttachment, setDownloadAttachment] = React.useState<Attachment | null>(null)
  const [showScrollArrows, setShowScrollArrows] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Build media items array
  const mediaItems: MediaItem[] = []
  
  // Add attachments
  if (attachments && attachments.length > 0) {
    attachments.forEach(attachment => {
      mediaItems.push({
        id: attachment.id,
        type: 'attachment',
        data: attachment
      })
    })
  }
  
  // Add video
  if (videoUrl) {
    mediaItems.push({
      id: 'video',
      type: 'video',
      data: { url: videoUrl }
    })
  }
  
  // Skip polls - they should stay in content area
  // if (pollData && pollData.options && pollData.options.length > 0) {
  //   mediaItems.push({
  //     id: 'poll',
  //     type: 'poll',
  //     data: pollData
  //   })
  // }

  // Extract GIFs from content
  if (content) {
    const gifRegex = /!\[GIF\]\(([^)]+)\)/g
    let gifMatch
    let gifIndex = 0
    while ((gifMatch = gifRegex.exec(content)) !== null) {
      mediaItems.push({
        id: `gif-${gifIndex}`,
        type: 'gif',
        data: { url: gifMatch[1] }
      })
      gifIndex++
    }
  }

  if (mediaItems.length === 0) return null

  const showNavigation = mediaItems.length > 1
  const currentItem = mediaItems[currentIndex]
  
  // State for tracking scroll position
  const [scrollPosition, setScrollPosition] = React.useState(0)
  const [maxScroll, setMaxScroll] = React.useState(0)

  // Check if content overflows and needs scroll arrows
  React.useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current
        setShowScrollArrows(scrollWidth > clientWidth)
        setScrollPosition(scrollLeft)
        setMaxScroll(scrollWidth - clientWidth)
      }
    }
    
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [mediaItems.length])

  // Update scroll position when user scrolls
  React.useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setScrollPosition(scrollContainerRef.current.scrollLeft)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  const goToItem = (index: number) => {
    setCurrentIndex(index)
  }

  const isPreviewableImage = (type: string) => {
    return type.startsWith('image/') && 
           (type.includes('jpeg') || type.includes('jpg') || type.includes('png') || 
            type.includes('gif') || type.includes('webp') || type.includes('svg'))
  }

  const isPreviewableVideo = (type: string) => {
    return type.startsWith('video/')
  }

  const renderVideoEmbed = (url: string, index?: number) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = ''
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0]
      } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0]
      }
      
      return (
        <div style={{
          position: 'relative',
          height: compact ? '230px' : '380px',
          width: 'auto',
          aspectRatio: '16/9'
        }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: theme.borders.borderRadius,
              border: 'none'
            }}
            allowFullScreen
            title="Embedded YouTube video"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )
    } else if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0]
      return (
        <div style={{
          position: 'relative',
          height: compact ? '230px' : '380px',
          width: 'auto',
          aspectRatio: '16/9'
        }}>
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: theme.borders.borderRadius,
              border: 'none'
            }}
            allowFullScreen
            title="Embedded Vimeo video"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )
    } else {
      return (
        <video 
          src={url}
          controls
          style={{
            borderRadius: theme.borders.borderRadius,
            height: compact ? '230px' : '380px',
            width: 'auto',
            objectFit: 'contain'
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )
    }
  }

  const renderMediaItem = (item: MediaItem, index: number) => {
    switch (item.type) {
      case 'attachment':
        const attachment = item.data as Attachment
        
        if (isPreviewableImage(attachment.type)) {
          return (
            <div style={{ position: 'relative', width: '100%' }}>
              <img
                src={attachment.preview}
                alt={attachment.name}
                style={{
                  borderRadius: theme.borders.borderRadius,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  height: compact ? '230px' : '380px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(index)
                  setIsExpanded(true)
                }}
              />
            </div>
          )
        } else if (isPreviewableVideo(attachment.type)) {
          return (
            <div 
              className="relative w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={attachment.preview}
                controls
                className={`rounded-lg ${compact ? 'max-w-xs max-h-48' : 'w-full max-h-96'}`}
              />
            </div>
          )
        } else {
          return (
            <div 
              className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                compact ? 'max-w-xs' : 'max-w-sm'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setDownloadAttachment(attachment)
                setIsDownloadModalOpen(true)
              }}
            >
              <div className="text-4xl mb-2">📄</div>
              <div className={`font-medium text-gray-700 mb-1 ${compact ? 'text-sm' : ''}`}>
                {attachment.name}
              </div>
              <div className={`text-gray-500 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                {(attachment.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className={`text-blue-600 hover:text-blue-800 ${compact ? 'text-xs' : 'text-sm'}`}>
                Click to download
              </div>
            </div>
          )
        }
      
      case 'video':
        return (
          <div 
            style={{ width: 'auto', height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderVideoEmbed(item.data.url, index)}
          </div>
        )
      
      case 'poll':
        const pollData = item.data
        return (
          <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 w-full`}>
            <div className={`font-semibold text-gray-900 mb-3 ${compact ? 'text-sm' : ''}`}>
              📊 Poll
            </div>
            <div className="space-y-2">
              {pollData.options?.map((option: string, index: number) => (
                <button
                  key={index}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                  onClick={() => {
                    // In a real implementation, this would handle poll voting
                    console.log('Poll vote:', option)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={compact ? 'text-sm' : ''}>{option}</span>
                    <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                      {pollData.votes?.[index] || 0} votes
                    </span>
                  </div>
                </button>
              )) || []}
            </div>
            <div className={`text-gray-500 mt-3 ${compact ? 'text-xs' : 'text-sm'}`}>
              {pollData.options?.length || 0} options • {(pollData.votes?.reduce((a: number, b: number) => a + b, 0) || 0)} total votes
            </div>
          </div>
        )
      
      case 'gif':
        return (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src={item.data.url}
              alt="GIF"
              style={{
                borderRadius: theme.borders.borderRadius,
                cursor: 'pointer',
                height: compact ? '230px' : '380px',
                width: 'auto',
                objectFit: 'contain'
              }}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
                setIsExpanded(true)
              }}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Display all media items in a horizontal scroll */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div 
          ref={scrollContainerRef}
          style={{ 
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            gap: theme.spacing.sm,
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            height: compact ? '250px' : '400px'
          }}
        >
          {mediaItems.map((item, index) => (
            <div 
              key={item.id} 
              style={{
                flexShrink: 0,
                height: compact ? '240px' : '390px',
                width: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {renderMediaItem(item, index)}
            </div>
          ))}
        </div>
        
        {/* Navigation arrows for scrolling */}
        {showScrollArrows && scrollPosition > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
              }
            }}
            style={{
              position: 'absolute',
              left: theme.spacing.sm,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: theme.spacing.sm,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </button>
        )}
        {showScrollArrows && scrollPosition < maxScroll - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
              }
            }}
            style={{
              position: 'absolute',
              right: theme.spacing.sm,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: theme.spacing.sm,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
          >
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>

      {/* Full-screen modal for images and GIFs */}
      {isExpanded && (
        (currentItem.type === 'attachment' && isPreviewableImage(currentItem.data.type)) || 
        currentItem.type === 'gif'
      ) && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(false)
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={currentItem.type === 'gif' ? currentItem.data.url : currentItem.data.preview}
              alt={currentItem.type === 'gif' ? 'GIF' : currentItem.data.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Navigation arrows - conditional visibility */}
            {mediaItems.length > 1 && currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevItem()
                }}
                style={{
                  position: 'fixed',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000
                }}
              >
                <ChevronLeft style={{ width: '28px', height: '28px' }} />
              </button>
            )}
            {mediaItems.length > 1 && currentIndex < mediaItems.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextItem()
                }}
                style={{
                  position: 'fixed',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000
                }}
              >
                <ChevronRight style={{ width: '28px', height: '28px' }} />
              </button>
            )}
            
            {/* Item counter */}
            {mediaItems.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontSize: '14px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {currentIndex + 1} of {mediaItems.length}
              </div>
            )}
            
            {showCloseButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(false)
                }}
                style={{
                  position: 'fixed',
                  top: '20px',
                  right: '20px',
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10001,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Download modal */}
      <AttachmentDownloadModal
        isOpen={isDownloadModalOpen}
        attachment={downloadAttachment}
        theme={theme}
        onClose={() => {
          setIsDownloadModalOpen(false)
          setDownloadAttachment(null)
        }}
      />
    </div>
  )
}
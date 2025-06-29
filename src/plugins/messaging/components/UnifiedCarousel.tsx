import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
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

interface UnifiedCarouselProps {
  attachments?: Attachment[]
  videoUrl?: string
  pollData?: { options: string[], votes?: number[] }
  content?: string
  theme: any
  type: 'post-feed' | 'post-detail' | 'comment' | 'reply'
  isFullScreen?: boolean
  onClose?: () => void
  initialIndex?: number
}

export const UnifiedCarousel: React.FC<UnifiedCarouselProps> = ({ 
  attachments = [],
  videoUrl,
  pollData,
  content = '',
  theme,
  type,
  isFullScreen = false,
  onClose,
  initialIndex = 0
}) => {
  // Build media items array first to check if we should render
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
    
    // Extract Videos from content
    const videoRegex = /\[Video: ([^\]]+)\]/g
    let videoMatch
    let videoIndex = 0
    while ((videoMatch = videoRegex.exec(content)) !== null) {
      mediaItems.push({
        id: `content-video-${videoIndex}`,
        type: 'video',
        data: { url: videoMatch[1] }
      })
      videoIndex++
    }
  }

  // Early return if no media items - BEFORE any hooks
  if (mediaItems.length === 0) return null

  // All hooks must come after early return check
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false)
  const [downloadAttachment, setDownloadAttachment] = React.useState<Attachment | null>(null)
  const [showScrollArrows, setShowScrollArrows] = React.useState(false)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [imagesLoaded, setImagesLoaded] = React.useState(0)
  const carouselId = React.useRef(`carousel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [isVisible, setIsVisible] = React.useState(true)

  // Force immediate cleanup on mount and reset visibility
  React.useEffect(() => {
    setIsVisible(true)
    setShowScrollArrows(false)
    setCanScrollLeft(false)
    setCanScrollRight(false)
  }, [])

  // Hide component completely when mediaItems change
  React.useEffect(() => {
    setIsVisible(false)
    setShowScrollArrows(false)
    setCanScrollLeft(false)
    setCanScrollRight(false)
    
    // Re-show after a brief delay to ensure clean state
    const timeoutId = setTimeout(() => {
      setIsVisible(true)
    }, 50)
    
    return () => clearTimeout(timeoutId)
  }, [attachments?.length, videoUrl, pollData?.options?.join(','), type])

  const currentItem = mediaItems[currentIndex]

  // Check if scroll arrows should be shown
  React.useEffect(() => {
    const checkScrollArrows = () => {
      if (scrollContainerRef.current && mediaItems.length > 0) {
        const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current
        const hasOverflow = scrollWidth > clientWidth + 2 // Add small buffer for rounding
        setShowScrollArrows(hasOverflow)
        if (hasOverflow) {
          setCanScrollLeft(scrollLeft > 0)
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        } else {
          setCanScrollLeft(false)
          setCanScrollRight(false)
        }
      } else {
        // Force hide arrows if no container or no media items
        setShowScrollArrows(false)
        setCanScrollLeft(false)
        setCanScrollRight(false)
      }
    }

    // Check immediately and after a delay to ensure images are loaded
    checkScrollArrows()
    const timeoutId = setTimeout(checkScrollArrows, 100)
    
    window.addEventListener('resize', checkScrollArrows)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkScrollArrows)
      // Force cleanup on effect cleanup
      setShowScrollArrows(false)
      setCanScrollLeft(false)
      setCanScrollRight(false)
    }
  }, [mediaItems.length, imagesLoaded])

  // Reset arrows immediately when mediaItems change (switching between different carousels)
  React.useEffect(() => {
    // Immediately hide arrows when mediaItems change
    setShowScrollArrows(false)
    setCanScrollLeft(false)
    setCanScrollRight(false)
    setImagesLoaded(0) // Reset image loading counter
    
    // Force a complete re-evaluation after a short delay
    const timeoutId = setTimeout(() => {
      setShowScrollArrows(false)
      setCanScrollLeft(false)
      setCanScrollRight(false)
    }, 10)
    
    return () => clearTimeout(timeoutId)
  }, [attachments?.length, videoUrl, pollData?.options?.join(','), type])

  // Cleanup arrows when component unmounts
  React.useEffect(() => {
    return () => {
      // Reset arrow states when component unmounts
      setShowScrollArrows(false)
      setCanScrollLeft(false)
      setCanScrollRight(false)
    }
  }, [])
  
  // Size calculations based on type
  const getImageHeight = () => {
    if (isFullScreen) return '90vh'
    if (type === 'post-feed' || type === 'post-detail') return '180px' // Same size for both post views
    return '120px' // Small for comments/replies
  }

  const getContainerHeight = () => {
    if (isFullScreen) return '100vh'
    if (type === 'post-feed' || type === 'post-detail') return '200px' // Same size for both post views
    return '140px' // Small for comments/replies
  }

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  const isPreviewableImage = (type: string) => {
    return type.startsWith('image/') && 
           (type.includes('jpeg') || type.includes('jpg') || type.includes('png') || 
            type.includes('gif') || type.includes('webp') || type.includes('svg'))
  }

  const renderVideoEmbed = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = ''
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0]
      } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0]
      }
      
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          style={{
            width: isFullScreen ? '90vw' : '100%',
            height: isFullScreen ? '50.625vw' : getImageHeight(), // 16:9 aspect ratio
            maxHeight: isFullScreen ? '90vh' : getImageHeight(),
            borderRadius: theme.borders.borderRadius,
            border: 'none'
          }}
          allowFullScreen
          title="Embedded YouTube video"
        />
      )
    } else if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0]
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          style={{
            width: isFullScreen ? '90vw' : '100%',
            height: isFullScreen ? '50.625vw' : getImageHeight(), // 16:9 aspect ratio
            maxHeight: isFullScreen ? '90vh' : getImageHeight(),
            borderRadius: theme.borders.borderRadius,
            border: 'none'
          }}
          allowFullScreen
          title="Embedded Vimeo video"
        />
      )
    } else {
      return (
        <video 
          src={url}
          controls
          style={{
            borderRadius: theme.borders.borderRadius,
            height: isFullScreen ? 'auto' : getImageHeight(),
            width: isFullScreen ? 'auto' : 'auto',
            maxWidth: isFullScreen ? '90vw' : '100%',
            maxHeight: isFullScreen ? '90vh' : getImageHeight(),
            objectFit: 'contain'
          }}
        />
      )
    }
  }

  const renderMediaItem = (item: MediaItem, index: number) => {
    switch (item.type) {
      case 'attachment':
        const attachment = item.data as Attachment
        
        // Handle video URL attachments
        if (attachment.type === 'video/url') {
          return renderVideoEmbed(attachment.preview)
        }
        
        // Handle GIF URL attachments
        if (attachment.type === 'image/gif' && attachment.preview.startsWith('http')) {
          return (
            <img
              src={attachment.preview}
              alt="GIF"
              style={{
                borderRadius: theme.borders.borderRadius,
                cursor: isFullScreen ? 'default' : 'pointer',
                height: getImageHeight(),
                width: 'auto',
                objectFit: 'contain'
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (!isFullScreen) {
                  setCurrentIndex(index)
                  setIsExpanded(true)
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              onLoad={() => setImagesLoaded(prev => prev + 1)}
            />
          )
        }
        
        if (isPreviewableImage(attachment.type)) {
          return (
            <img
              src={attachment.preview}
              alt={attachment.name}
              style={{
                borderRadius: theme.borders.borderRadius,
                cursor: isFullScreen ? 'default' : 'pointer',
                transition: 'transform 0.2s',
                height: getImageHeight(),
                width: 'auto',
                objectFit: 'contain'
              }}
              onMouseEnter={(e) => !isFullScreen && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => !isFullScreen && (e.currentTarget.style.transform = 'scale(1)')}
              onClick={(e) => {
                e.stopPropagation()
                if (!isFullScreen) {
                  setCurrentIndex(index)
                  setIsExpanded(true)
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              onLoad={() => setImagesLoaded(prev => prev + 1)}
            />
          )
        } else {
          return (
            <div 
              style={{
                border: `2px dashed ${theme.borders.borderColor}`,
                borderRadius: theme.borders.borderRadius,
                padding: theme.spacing.sm,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: theme.colors.surface,
                height: getImageHeight(),
                width: (type === 'post-feed' || type === 'post-detail') ? '200px' : '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={(e) => {
                e.stopPropagation()
                setDownloadAttachment(attachment)
                setIsDownloadModalOpen(true)
              }}
            >
              <div style={{ fontSize: (type === 'post-feed' || type === 'post-detail') ? '24px' : '16px', marginBottom: '4px' }}>📄</div>
              <div style={{ fontSize: (type === 'post-feed' || type === 'post-detail') ? '12px' : '10px', fontWeight: 500 }}>
                {attachment.name.length > 10 ? attachment.name.substring(0, 10) + '...' : attachment.name}
              </div>
            </div>
          )
        }
      
      case 'video':
        return renderVideoEmbed(item.data.url)
      
      case 'gif':
        return (
          <img
            src={item.data.url}
            alt="GIF"
            style={{
              borderRadius: theme.borders.borderRadius,
              cursor: isFullScreen ? 'default' : 'pointer',
              height: getImageHeight(),
              width: 'auto',
              objectFit: 'contain'
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (!isFullScreen) {
                setCurrentIndex(index)
                setIsExpanded(true)
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onLoad={() => setImagesLoaded(prev => prev + 1)}
          />
        )
      
      default:
        return null
    }
  }

  // If this IS the fullscreen view, render accordingly
  if (isFullScreen) {
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            if (onClose) {
              onClose()
            } else {
              setIsExpanded(false)
            }
          }
        }}
      >
        <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderMediaItem(currentItem, currentIndex)}
          
          {/* Download button */}
          {currentItem.type === 'attachment' && isPreviewableImage((currentItem.data as Attachment).type) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const attachment = currentItem.data as Attachment
                const link = document.createElement('a')
                link.href = attachment.preview
                link.download = attachment.name
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              style={{
                position: 'fixed',
                top: '30px',
                right: '90px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                zIndex: 1000000
              }}
              title="Download"
            >
              ⬇
            </button>
          )}

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onClose) {
                onClose()
              } else {
                setIsExpanded(false)
              }
            }}
            style={{
              position: 'fixed',
              top: '30px',
              right: '30px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              zIndex: 1000000
            }}
          >
            ×
          </button>
          
          {/* Navigation arrows */}
          {mediaItems.length > 1 && currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevItem()
              }}
              style={{
                position: 'fixed',
                left: '30px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={28} />
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
                right: '30px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={28} />
            </button>
          )}
          
          {/* Image counter */}
          {mediaItems.length > 1 && (
            <div style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              {currentIndex + 1} of {mediaItems.length}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Regular carousel view
  return (
    <div 
      style={{ position: 'relative', width: '100%', overflow: 'hidden', zIndex: 0 }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div 
        key={`carousel-${attachments?.length || 0}-${videoUrl || ''}-${type}`}
        ref={scrollContainerRef}
        style={{ 
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          gap: theme.spacing.xs,
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          height: getContainerHeight(),
          padding: type === 'comment' || type === 'reply' ? '4px' : '0'
        }}
        className="hide-scrollbar"
        onScroll={() => {
          if (scrollContainerRef.current) {
            const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current
            const hasOverflow = scrollWidth > clientWidth + 2 // Add small buffer for rounding
            setShowScrollArrows(hasOverflow)
            if (hasOverflow) {
              setCanScrollLeft(scrollLeft > 0)
              setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
            } else {
              setCanScrollLeft(false)
              setCanScrollRight(false)
            }
          }
        }}
      >
        {mediaItems.map((item, index) => (
          <div 
            key={item.id} 
            style={{
              flexShrink: 0,
              height: getImageHeight(),
              width: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              const expandBtn = e.currentTarget.querySelector('.expand-btn')
              if (expandBtn) {
                (expandBtn as HTMLElement).style.opacity = '1'
              }
            }}
            onMouseLeave={(e) => {
              const expandBtn = e.currentTarget.querySelector('.expand-btn')
              if (expandBtn) {
                (expandBtn as HTMLElement).style.opacity = '0'
              }
            }}
          >
            {renderMediaItem(item, index)}
            
            {/* Expand button - appears on hover */}
            <button
              className="expand-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentIndex(index)
                setIsExpanded(true)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'white',
                color: '#333',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: '0',
                transition: 'opacity 0.2s ease',
                zIndex: 1,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {/* Custom expand arrows - pointing to top-right and bottom-left */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {/* Top-right arrow */}
                <path d="M10 3h3v3M13 3l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Bottom-left arrow */}
                <path d="M6 13H3v-3M3 13l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Navigation arrows for regular view */}
      {mediaItems.length > 1 && showScrollArrows && !isExpanded && scrollContainerRef.current && mediaItems.length > 0 && (
        <>
          {canScrollLeft && scrollContainerRef.current && (
            <button
              onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            style={{
              position: 'absolute',
              left: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
          >
            <ChevronLeft size={24} />
          </button>
          )}
          
          {canScrollRight && scrollContainerRef.current && (
            <button
              onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
          >
            <ChevronRight size={24} />
          </button>
          )}
        </>
      )}

      {/* Common Fullscreen modal */}
      {isExpanded && ReactDOM.createPortal(
        <UnifiedCarousel
          attachments={attachments}
          videoUrl={videoUrl}
          pollData={pollData}
          content={content}
          theme={theme}
          type={type}
          isFullScreen={true}
          onClose={() => setIsExpanded(false)}
          initialIndex={currentIndex}
        />,
        document.body
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
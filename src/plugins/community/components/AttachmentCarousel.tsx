import * as React from 'react'
import { AttachmentDownloadModal } from './AttachmentDownloadModal'

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  preview: string
}

interface AttachmentCarouselProps {
  attachments: Attachment[]
  theme: any
}

export const AttachmentCarousel: React.FC<AttachmentCarouselProps> = ({ 
  attachments, 
  theme 
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false)
  const [downloadAttachment, setDownloadAttachment] = React.useState<Attachment | null>(null)

  if (!attachments || attachments.length === 0) return null

  const showNavigation = attachments.length > 1
  const showCarousel = attachments.length > 3

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % attachments.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  const isPreviewableImage = (type: string) => {
    return type.startsWith('image/') && 
           (type.includes('jpeg') || type.includes('jpg') || type.includes('png') || 
            type.includes('gif') || type.includes('webp') || type.includes('svg'))
  }

  const isPreviewableVideo = (type: string) => {
    return type.startsWith('video/') && 
           (type.includes('mp4') || type.includes('webm') || type.includes('ogg'))
  }

  const handleAttachmentClick = (attachment: Attachment, index: number) => {
    if (isPreviewableImage(attachment.type) || isPreviewableVideo(attachment.type)) {
      setCurrentIndex(index)
      setIsExpanded(true)
    } else {
      setDownloadAttachment(attachment)
      setIsDownloadModalOpen(true)
    }
  }

  // If expanded, show full carousel view
  if (isExpanded) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: theme.spacing.lg
      }}>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'absolute',
            top: theme.spacing.lg,
            right: theme.spacing.lg,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
        
        <div style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isPreviewableImage(attachments[currentIndex].type) ? (
            <img
              src={attachments[currentIndex].preview}
              alt={attachments[currentIndex].name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : isPreviewableVideo(attachments[currentIndex].type) ? (
            <video
              src={attachments[currentIndex].preview}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{
              width: '300px',
              height: '300px',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borders.borderRadius,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.lg
            }}>
              <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>📄</div>
              <div style={{
                fontSize: theme.font.sizeLg,
                color: theme.colors.textPrimary,
                textAlign: 'center',
                wordBreak: 'break-all'
              }}>
                {attachments[currentIndex].name}
              </div>
            </div>
          )}
          
          {showNavigation && (
            <>
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute',
                  left: '-60px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                style={{
                  position: 'absolute',
                  right: '-60px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
        
        {showNavigation && (
          <div style={{
            position: 'absolute',
            bottom: theme.spacing.lg,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: theme.spacing.xs
          }}>
            {attachments.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Regular inline display
  return (
    <div style={{
      marginTop: theme.spacing.sm,
      border: `1px solid ${theme.borders.borderColor}`,
      borderRadius: theme.borders.borderRadius,
      overflow: 'hidden'
    }}>
      {showCarousel ? (
        // Carousel view for many attachments
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {attachments.slice(0, 3).map((attachment, index) => (
              <div
                key={attachment.id}
                onClick={() => handleAttachmentClick(attachment, index)}
                style={{
                  minWidth: 'calc(33.333% - 4px)',
                  height: '150px',
                  cursor: 'pointer',
                  position: 'relative',
                  marginRight: index < 2 ? '2px' : 0
                }}
              >
                {isPreviewableImage(attachment.type) ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: theme.colors.surfaceAlt,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: theme.spacing.sm
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: theme.spacing.xs }}>📄</div>
                    <div style={{
                      fontSize: theme.font.sizeXs,
                      color: theme.colors.textSecondary,
                      textAlign: 'center',
                      wordBreak: 'break-all'
                    }}>
                      {attachment.name.length > 15 
                        ? attachment.name.substring(0, 15) + '...' 
                        : attachment.name}
                    </div>
                  </div>
                )}
                {index === 2 && attachments.length > 3 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: theme.font.sizeLg,
                    fontWeight: 600
                  }}>
                    +{attachments.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Grid view for few attachments
        <div style={{
          display: 'grid',
          gridTemplateColumns: attachments.length === 1 ? '1fr' : 
                              attachments.length === 2 ? 'repeat(2, 1fr)' : 
                              'repeat(3, 1fr)',
          gap: '2px'
        }}>
          {attachments.map((attachment, index) => (
            <div
              key={attachment.id}
              onClick={() => handleAttachmentClick(attachment, index)}
              style={{
                height: attachments.length === 1 ? '300px' : '150px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {isPreviewableImage(attachment.type) ? (
                <img
                  src={attachment.preview}
                  alt={attachment.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: theme.colors.surfaceAlt,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: theme.spacing.sm
                }}>
                  <div style={{ fontSize: '32px', marginBottom: theme.spacing.xs }}>📄</div>
                  <div style={{
                    fontSize: theme.font.sizeSm,
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    wordBreak: 'break-all'
                  }}>
                    {attachment.name.length > 20 
                      ? attachment.name.substring(0, 20) + '...' 
                      : attachment.name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Download Modal */}
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
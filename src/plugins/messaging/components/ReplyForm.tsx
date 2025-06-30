import * as React from 'react'
import type { ReplyFormProps } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { UnifiedToolbar } from './UnifiedToolbar'
import { RichTextArea } from './RichTextArea'

export const ReplyForm: React.FC<ReplyFormProps> = ({
  parentId,
  currentUser,
  onSubmit,
  onCancel,
  placeholder = "Write a reply..."
}) => {
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const textareaRef = React.useRef<HTMLDivElement>(null)
  
  // ComposeToolbar state
  const [linkUrl, setLinkUrl] = React.useState('')
  const [videoUrl, setVideoUrl] = React.useState('')
  const [mediaType, setMediaType] = React.useState<string>('none')
  const [pollOptions, setPollOptions] = React.useState<string[]>(['', ''])
  const [attachments, setAttachments] = React.useState<Array<{id: string, file: File, preview: string}>>([])

  // Auto-focus on mount
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Create media data from current state
      let mediaData: any = null
      if (mediaType === 'video' && videoUrl.trim()) {
        mediaData = { type: 'video', url: videoUrl.trim() }
      }

      // Add attachments to media data
      if (attachments.length > 0) {
        mediaData = { 
          ...mediaData, 
          attachments: attachments.map(att => ({
            id: att.id,
            name: att.file.name,
            size: att.file.size,
            type: att.file.type,
            preview: att.preview
          }))
        }
      }
      
      // Pass content, parentId, and mediaData
      await onSubmit(content.trim(), parentId, mediaData)
      
      // Reset form
      setContent('')
      setVideoUrl('')
      setLinkUrl('')
      setMediaType('none')
      setPollOptions(['', ''])
      setAttachments([])
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
    }
    
    if (e.key === 'Escape') {
      onCancel?.()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement> | any) => {
    // Handle GIF attachment from ComposeToolbar
    if (event.gifAttachment) {
      setAttachments(prev => [...prev, event.gifAttachment])
      return
    }
    
    const files = event.target.files
    if (!files) return

    Array.from(files as FileList).forEach((file: File) => {
      const maxSize = 2 * 1024 * 1024 // 2MB limit
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 2MB.`)
        return
      }

      const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const preview = e.target?.result as string
        
        if (file.type.startsWith('image/')) {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            const maxDimension = 300
            let { width, height } = img
            
            if (width > height) {
              if (width > maxDimension) {
                height = (height * maxDimension) / width
                width = maxDimension
              }
            } else {
              if (height > maxDimension) {
                width = (width * maxDimension) / height
                height = maxDimension
              }
            }
            
            canvas.width = width
            canvas.height = height
            
            ctx?.drawImage(img, 0, 0, width, height)
            const compressedPreview = canvas.toDataURL('image/jpeg', 0.7)
            
            setAttachments(prev => [...prev, { id, file, preview: compressedPreview }])
          }
          img.src = preview
        } else {
          setAttachments(prev => [...prev, { id, file, preview }])
        }
      }
      
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex space-x-3">
        {/* User avatar */}
        <div className="flex-shrink-0">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: defaultTheme.colors.surfaceAlt }}
          >
            {currentUser?.profile?.avatarUrl ? (
              <img 
                src={currentUser.profile.avatarUrl} 
                alt={currentUser.profile.displayName || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (currentUser?.profile?.displayName?.charAt(0) || 'U').toUpperCase()
            )}
          </div>
        </div>

        {/* Single container with text, carousel, and toolbar */}
        <div className="flex-1">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 space-y-3">
            <form onSubmit={handleSubmit}>
              <RichTextArea
                ref={textareaRef}
                value={content}
                onChange={setContent}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                style={{
                  width: '100%',
                  resize: 'none',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '0',
                  padding: '0',
                  fontSize: '0.875rem',
                  minHeight: '36px',
                  maxHeight: '120px',
                  outline: 'none'
                }}
              />
              
              {/* Carousel inside the container - only show if there's content */}
              {(attachments.length > 0 || videoUrl) && (
                <div className="mt-3">
                  {/* UnifiedCarousel would go here if we want to show existing media */}
                </div>
              )}
              
              {/* UnifiedToolbar inside the container */}
              <UnifiedToolbar
                theme={defaultTheme}
                content={content}
                setContent={setContent}
                contentRef={textareaRef}
                linkUrl={linkUrl}
                setLinkUrl={setLinkUrl}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                mediaType={mediaType}
                setMediaType={setMediaType}
                pollOptions={pollOptions}
                setPollOptions={setPollOptions}
                attachments={attachments}
                setAttachments={setAttachments}
                onFileUpload={handleFileUpload}
                compact={true}
                showSubmit={false}
                type="reply"
              />
            </form>
          </div>
        </div>
      </div>
      
      {/* Save/Cancel buttons outside the container */}
      <div className="flex gap-2 justify-end ml-11">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
          >
            CANCEL
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 bg-gray-300 text-black font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'SAVING...' : 'SAVE'}
        </button>
      </div>
    </div>
  )
}
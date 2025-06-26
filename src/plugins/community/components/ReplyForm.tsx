import * as React from 'react'
import { Send, X } from 'lucide-react'
import type { ReplyFormProps } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { ComposeToolbar } from './ComposeToolbar'

export const ReplyForm: React.FC<ReplyFormProps> = ({
  parentId,
  postId,
  currentUser,
  onSubmit,
  onCancel,
  placeholder = "Write a reply..."
}) => {
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  
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

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Create media data from current state
      let mediaData: any = null
      if (mediaType === 'video' && videoUrl.trim()) {
        mediaData = { type: 'video', url: videoUrl.trim() }
      } else if (mediaType === 'poll') {
        const validOptions = pollOptions.filter(opt => opt.trim())
        if (validOptions.length >= 2) {
          mediaData = { type: 'poll', options: validOptions }
        }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
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
    <div className="bg-white border border-gray-200 rounded-lg p-3">
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

        {/* Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none border-0 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              rows={1}
              style={{ minHeight: '36px', maxHeight: '120px' }}
            />
            
            {/* ComposeToolbar */}
            <div className="mt-2">
              <ComposeToolbar
                theme={defaultTheme}
                content={content}
                setContent={setContent}
                contentRef={textareaRef}
                linkUrl={linkUrl}
                setLinkUrl={setLinkUrl}
                onFileUpload={handleFileUpload}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                mediaType={mediaType}
                setMediaType={setMediaType}
                pollOptions={pollOptions}
                setPollOptions={setPollOptions}
                showPoll={true}
                showVideo={true}
                showAttachment={true}
                compact={true}
              />
            </div>

            {/* Media-specific inputs */}
            {mediaType === 'video' && (
              <input
                type="url"
                placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              />
            )}

            {mediaType === 'poll' && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-900 mb-2">
                  Poll Options
                </div>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-1 mb-1">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions]
                        newOptions[index] = e.target.value
                        setPollOptions(newOptions)
                      }}
                      className="flex-1 p-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => {
                          const newOptions = pollOptions.filter((_, i) => i !== index)
                          setPollOptions(newOptions)
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-xs text-blue-600 hover:text-blue-800 border border-dashed border-gray-300 rounded p-1.5 w-full mt-1"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}

            {/* Attachments Display */}
            {attachments.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-900 mb-1">
                  Attachments ({attachments.length})
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative min-w-[60px] h-16 bg-gray-100 rounded border overflow-hidden">
                      {attachment.file.type.startsWith('image/') ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-600">
                          <div>📄</div>
                          <div className="truncate w-full px-1 text-center text-xs">
                            {attachment.file.name.length > 6 
                              ? attachment.file.name.substring(0, 6) + '...' 
                              : attachment.file.name}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setAttachments(prev => prev.filter(att => att.id !== attachment.id))}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-bl flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end mt-2 space-x-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  content.trim() && !isSubmitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}
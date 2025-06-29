import * as React from 'react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface EmojiPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onEmojiClick: (emoji: string) => void
  theme: any
}

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onEmojiClick,
  theme
}) => {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick(emojiData.emoji)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: theme.borders.borderRadius,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.borders.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3 style={{ 
            margin: 0, 
            fontSize: theme.font.sizeMd,
            fontWeight: 600,
            color: theme.colors.textPrimary
          }}>
            Choose an emoji
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: theme.colors.textSecondary,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ×
          </button>
        </div>

        {/* Emoji Picker */}
        <div 
          style={{ 
            padding: theme.spacing.sm,
            position: 'relative'
          }}
        >
          <style>
            {`
              .EmojiPickerReact .epr-emoji-category-label:first-of-type,
              .EmojiPickerReact .epr-emoji-category[data-name="Frequently Used"],
              .EmojiPickerReact .epr-emoji-category:first-child {
                display: none !important;
              }
              .EmojiPickerReact .epr-body {
                height: 300px !important;
              }
              .EmojiPickerReact .epr-emoji-category .epr-emoji-list {
                grid-template-rows: repeat(5, 1fr) !important;
                max-height: 240px !important;
              }
            `}
          </style>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={320}
            height={380}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: false
            }}
            lazyLoadEmojis={true}
          />
        </div>
      </div>
    </div>
  )
}
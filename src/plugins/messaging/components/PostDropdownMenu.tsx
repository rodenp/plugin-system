import * as React from 'react'
import { MoreVertical } from 'lucide-react'

interface PostDropdownMenuProps {
  postId: string
  authorId: string
  currentUserId: string
  isPinned: boolean
  commentsDisabled?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onCopyLink?: () => void
  onChangeCategory?: () => void
  onPinToFeed?: () => void
  onPinToCoursePage?: () => void
  onToggleComments?: () => void
  onReport?: () => void
  theme: any
}

export const PostDropdownMenu: React.FC<PostDropdownMenuProps> = ({
  postId,
  authorId,
  currentUserId,
  isPinned,
  commentsDisabled = false,
  onEdit,
  onDelete,
  onCopyLink,
  onChangeCategory,
  onPinToFeed,
  onPinToCoursePage,
  onToggleComments,
  onReport,
  theme
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleOptionClick = (e: React.MouseEvent, callback?: () => void) => {
    e.stopPropagation()
    setIsOpen(false)
    if (callback) {
      callback()
    }
  }

  const isOwner = currentUserId === authorId

  const menuItemStyle: React.CSSProperties = {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    fontSize: theme.font.sizeMd,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    color: theme.colors.textPrimary,
    transition: 'background-color 0.2s',
    fontFamily: theme.font.family
  }

  const deleteItemStyle: React.CSSProperties = {
    ...menuItemStyle,
    color: '#DC2626', // red color for delete
    borderTop: `1px solid ${theme.borders.borderColor}`,
    marginTop: theme.spacing.xs
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={handleMenuClick}
        style={{
          background: isOpen ? theme.colors.surfaceAlt : 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: theme.colors.textSecondary,
          transition: 'all 0.2s'
        }}
        className="post-menu-button"
      >
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: isOpen ? theme.colors.surfaceAlt : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MoreVertical size={16} />
        </div>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: theme.spacing.xs,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borders.borderRadius,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '200px',
            zIndex: 1000,
            overflow: 'hidden',
            border: `1px solid ${theme.borders.borderColor}`
          }}
        >
          {isOwner && onEdit && (
            <button
              onClick={(e) => handleOptionClick(e, onEdit)}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Edit
            </button>
          )}

          <button
            onClick={(e) => handleOptionClick(e, onCopyLink)}
            style={menuItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Copy link
          </button>

          {isOwner && (
            <button
              onClick={(e) => handleOptionClick(e, onChangeCategory)}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Change category
            </button>
          )}

          {isOwner && (
            <button
              onClick={(e) => handleOptionClick(e, onPinToFeed)}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isPinned ? 'Unpin from feed' : 'Pin to feed'}
            </button>
          )}

          {isOwner && (
            <button
              onClick={(e) => handleOptionClick(e, onPinToCoursePage)}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Pin to course page
            </button>
          )}

          {isOwner && (
            <button
              onClick={(e) => handleOptionClick(e, onToggleComments)}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {commentsDisabled ? 'Turn on comments' : 'Turn off comments'}
            </button>
          )}

          {!isOwner && (
            <button
              onClick={(e) => handleOptionClick(e, onReport)}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Report to admins
            </button>
          )}

          {isOwner && onDelete && (
            <button
              onClick={(e) => handleOptionClick(e, onDelete)}
              style={deleteItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
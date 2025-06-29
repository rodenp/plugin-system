import * as React from 'react'

interface RichTextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  rows?: number
}

export const RichTextArea = React.forwardRef<HTMLDivElement, RichTextAreaProps>(({
  value,
  onChange,
  placeholder,
  style,
  onFocus,
  onBlur,
  onKeyDown,
  rows = 6
}, ref) => {
  const editableRef = React.useRef<HTMLDivElement>(null)
  const lastValueRef = React.useRef(value)

  // Provide access to selection methods for the toolbar
  React.useImperativeHandle(ref, () => editableRef.current, [])

  // Update content when value changes externally
  React.useEffect(() => {
    const element = editableRef.current
    if (!element) return
    
    // Only update if value changed from external source (not from user typing)
    if (value !== lastValueRef.current) {
      const htmlContent = markdownToHtml(value)
      if (element.innerHTML !== htmlContent) {
        element.innerHTML = htmlContent
      }
      lastValueRef.current = value
    }
  }, [value])

  // Set initial content
  React.useEffect(() => {
    const element = editableRef.current
    if (element && value) {
      const htmlContent = markdownToHtml(value)
      element.innerHTML = htmlContent
      lastValueRef.current = value
    }
  }, [])

  // Convert markdown to HTML for display, or return HTML as-is
  const markdownToHtml = (text: string) => {
    if (!text) return ''
    
    // If the text already contains HTML links, return as-is
    if (text.includes('<a href=')) {
      return text
    }
    
    // Convert [text](url) to <a> tags with inline styles
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" style="color: #0066cc; text-decoration: underline; cursor: pointer;" contenteditable="false">$1</a>'
    )
  }

  // Convert HTML back to markdown
  const htmlToMarkdown = (html: string) => {
    // Convert <a> tags back to [text](url)
    return html.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '[$2]($1)')
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    let html = element.innerHTML
    
    // Normalize empty content
    if (html === '<br>' || html === '<div><br></div>') {
      html = ''
    }
    
    // Check if the HTML contains actual link elements (not just markdown)
    const hasHtmlLinks = html.includes('<a href=')
    
    if (hasHtmlLinks || html.includes('<br')) {
      // If we have HTML links or line breaks, preserve the HTML format
      lastValueRef.current = html
      onChange(html)
    } else {
      // Convert HTML back to markdown for plain text
      const text = htmlToMarkdown(html)
      lastValueRef.current = text
      onChange(text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter key - allow line breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      // Insert a line break for Enter key (not Shift+Enter)
      e.preventDefault()
      e.stopPropagation() // Prevent form submission
      
      // Insert line break at cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        // Insert a br element
        const br = document.createElement('br')
        range.insertNode(br)
        
        // Move cursor after the br
        range.setStartAfter(br)
        range.setEndAfter(br)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      // Trigger input event to update the value
      const inputEvent = new Event('input', { bubbles: true })
      e.currentTarget.dispatchEvent(inputEvent)
      return
    }
    
    // Call the parent's onKeyDown handler for other keys
    onKeyDown?.(e)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <div
      ref={editableRef}
      contentEditable
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        ...style,
        minHeight: `${rows * 1.5}em`,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        outline: 'none',
        overflow: 'auto'
      }}
      suppressContentEditableWarning={true}
      data-placeholder={!value ? placeholder : ''}
    />
  )
})
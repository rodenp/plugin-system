import * as React from 'react'

interface ContentRendererProps {
  content: string
  theme: any
  excludeGifs?: boolean
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, theme, excludeGifs = false }) => {
  // Convert markdown and URLs to HTML (same logic as RichTextArea)
  const markdownToHtml = (text: string) => {
    if (!text) return ''
    
    // If the text already contains HTML links, return as-is
    if (text.includes('<a href=')) {
      return text
    }
    
    let processedText = text
    
    // First, convert [text](url) to <a> tags with inline styles
    processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      `<a href="$2" style="color: ${theme.colors.secondary}; text-decoration: underline; cursor: pointer;" target="_blank" rel="noopener noreferrer">$1</a>`
    )
    
    // Then, convert raw URLs to clickable links (but not ones already inside markdown links)
    const urlRegex = /(https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)/g
    processedText = processedText.replace(urlRegex, (match, url) => {
      // Check if this URL is already inside an <a> tag
      const beforeMatch = processedText.substring(0, processedText.indexOf(match))
      const afterMatch = processedText.substring(processedText.indexOf(match) + match.length)
      
      // Simple check: if there's an unclosed <a tag before and </a> after, skip
      const openTagsBefore = (beforeMatch.match(/<a[^>]*>/g) || []).length
      const closeTagsBefore = (beforeMatch.match(/<\/a>/g) || []).length
      const closeTagsAfter = (afterMatch.match(/<\/a>/g) || []).length
      
      if (openTagsBefore > closeTagsBefore && closeTagsAfter > 0) {
        return match // Don't convert, it's already inside a link
      }
      
      return `<a href="${url}" style="color: ${theme.colors.secondary}; text-decoration: underline; cursor: pointer;" target="_blank" rel="noopener noreferrer">${url}</a>`
    })
    
    return processedText
  }

  const renderContent = () => {
    // Handle undefined/null content
    if (!content) return null
    
    // If excluding GIFs, filter them out first
    let processedContent = excludeGifs ? content.replace(/!\[GIF\]\([^)]+\)/g, '').trim() : content
    
    if (!processedContent) return null

    // If content contains HTML (from rich text editor), use it as-is but process for links
    if (processedContent.includes('<') && processedContent.includes('>')) {
      // Content is already HTML, just ensure links are processed
      const htmlContent = markdownToHtml(processedContent)
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
        />
      )
    }

    // Convert markdown/text content to HTML with proper link handling
    const htmlContent = markdownToHtml(processedContent)
    
    // Convert newlines to <br> tags for proper display
    const htmlWithBreaks = htmlContent.replace(/\n/g, '<br>')
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: htmlWithBreaks }}
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
      />
    )
  }

  return <>{renderContent()}</>
}
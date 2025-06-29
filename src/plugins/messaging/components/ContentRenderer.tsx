import * as React from 'react'

interface ContentRendererProps {
  content: string
  theme: any
  excludeGifs?: boolean
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, theme, excludeGifs = false }) => {
  const processTextWithLinks = (text: string): React.ReactNode[] => {
    const urlRegex = /(https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)/g
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const gifMarkdownRegex = /!\[GIF\]\(([^)]+)\)/g
    
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    
    // First, find and replace markdown links and GIFs
    const markdownMatches: Array<{match: RegExpExecArray, type: 'markdown' | 'gif'}> = []
    
    // Find markdown links
    let markdownMatch: RegExpExecArray | null
    while ((markdownMatch = markdownLinkRegex.exec(text)) !== null) {
      markdownMatches.push({ match: markdownMatch, type: 'markdown' })
    }
    
    // Find GIF markdown (only if not excluding GIFs)
    if (!excludeGifs) {
      let gifMatch: RegExpExecArray | null
      while ((gifMatch = gifMarkdownRegex.exec(text)) !== null) {
        markdownMatches.push({ match: gifMatch, type: 'gif' })
      }
    }
    
    // Then find plain URLs (but not inside markdown links)
    const urlMatches: Array<{match: RegExpExecArray, type: 'url'}> = []
    let urlMatch: RegExpExecArray | null
    while ((urlMatch = urlRegex.exec(text)) !== null) {
      // Check if this URL is inside a markdown link
      const isInsideMarkdown = markdownMatches.some(mdMatch => 
        urlMatch!.index >= mdMatch.match.index && 
        urlMatch!.index < mdMatch.match.index + mdMatch.match[0].length
      )
      if (!isInsideMarkdown) {
        urlMatches.push({ match: urlMatch, type: 'url' })
      }
    }
    
    // Combine and sort all matches by position
    const allMatches = [...markdownMatches, ...urlMatches].sort((a, b) => a.match.index - b.match.index)
    
    allMatches.forEach((matchData, index) => {
      const { match, type } = matchData
      const startIndex = match.index
      const fullMatch = match[0]
      
      // Add text before this match
      if (startIndex > lastIndex) {
        const textBefore = text.substring(lastIndex, startIndex)
        if (textBefore) {
          elements.push(textBefore)
        }
      }
      
      // Add the link or GIF
      if (type === 'markdown') {
        const [, linkText, url] = match
        elements.push(
          <a
            key={`md-link-${startIndex}-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.colors.secondary,
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {linkText}
          </a>
        )
      } else if (type === 'gif') {
        const [, gifUrl] = match
        elements.push(
          <img
            key={`gif-${startIndex}-${index}`}
            src={gifUrl}
            alt="GIF"
            style={{
              maxWidth: '300px',
              maxHeight: '200px',
              borderRadius: '8px',
              margin: '4px 0',
              display: 'block'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )
      } else {
        const url = match[0]
        elements.push(
          <a
            key={`url-link-${startIndex}-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.colors.secondary,
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        )
      }
      
      lastIndex = startIndex + fullMatch.length
    })
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex)
      if (remainingText) {
        elements.push(remainingText)
      }
    }
    
    // If no matches found, return the original text
    if (elements.length === 0) {
      return [text]
    }
    
    return elements
  }

  const renderContent = () => {
    // Handle undefined/null content
    if (!content) return null
    
    // If excluding GIFs, filter them out first
    let processedContent = excludeGifs ? content.replace(/!\[GIF\]\([^)]+\)/g, '').trim() : content
    
    if (!processedContent) return null

    // If content contains HTML (from rich text editor), strip tags but preserve line breaks
    if (processedContent.includes('<') && processedContent.includes('>')) {
      processedContent = processedContent
        .replace(/<br\s*\/?>/gi, '\n') // Replace <br> tags with newlines
        .replace(/<[^>]*>/g, '') // Strip all other HTML tags
        .trim();
    }

    // Split content by newlines and process each line
    const lines = processedContent.split('\n')
    const processedLines: React.ReactNode[] = []

    lines.forEach((line, lineIndex) => {
      if (line.trim()) {
        const processedLine = processTextWithLinks(line)
        processedLines.push(
          <span key={`line-${lineIndex}`}>
            {processedLine}
          </span>
        )
      }
      
      // Add line break after each line except the last
      if (lineIndex < lines.length - 1) {
        processedLines.push(<br key={`br-${lineIndex}`} />)
      }
    })

    return processedLines.length > 0 ? processedLines : null
  }

  return <>{renderContent()}</>
}
import * as React from 'react'

interface ContentRendererProps {
  content: string
  theme: any
  excludeGifs?: boolean
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, theme, excludeGifs = false }) => {
  const renderContent = () => {
    // If excluding GIFs, filter them out first
    const processedContent = excludeGifs ? content.replace(/!\[GIF\]\([^)]+\)/g, '').trim() : content
    
    
    if (!processedContent) return null
    // More comprehensive URL regex
    const urlRegex = /(https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)/g
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const gifMarkdownRegex = /!\[GIF\]\(([^)]+)\)/g
    
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    
    // First, find and replace markdown links and GIFs
    const markdownMatches: Array<{match: RegExpExecArray, type: 'markdown' | 'gif'}> = []
    
    // Find markdown links
    let markdownMatch: RegExpExecArray | null
    while ((markdownMatch = markdownLinkRegex.exec(processedContent)) !== null) {
      markdownMatches.push({ match: markdownMatch, type: 'markdown' })
    }
    
    // Find GIF markdown (only if not excluding GIFs)
    if (!excludeGifs) {
      let gifMatch: RegExpExecArray | null
      while ((gifMatch = gifMarkdownRegex.exec(processedContent)) !== null) {
        markdownMatches.push({ match: gifMatch, type: 'gif' })
      }
    }
    
    // Then find plain URLs (but not inside markdown links)
    const urlMatches: Array<{match: RegExpExecArray, type: 'url'}> = []
    let urlMatch: RegExpExecArray | null
    while ((urlMatch = urlRegex.exec(processedContent)) !== null) {
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
    
    allMatches.forEach((matchData) => {
      const { match, type } = matchData
      const startIndex = match.index
      const fullMatch = match[0]
      
      // Add text before this match
      if (startIndex > lastIndex) {
        const textBefore = processedContent.substring(lastIndex, startIndex)
        if (textBefore) {
          elements.push(textBefore)
        }
      }
      
      // Add the link or GIF
      if (type === 'markdown') {
        const [, linkText, url] = match
        elements.push(
          <a
            key={`md-link-${startIndex}`}
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
            key={`gif-${startIndex}`}
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
            key={`url-link-${startIndex}`}
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
    if (lastIndex < processedContent.length) {
      const remainingText = processedContent.substring(lastIndex)
      if (remainingText) {
        elements.push(remainingText)
      }
    }
    
    // If no matches found, return processed content
    if (elements.length === 0) {
      return processedContent
    }
    
    return elements
  }

  return <>{renderContent()}</>
}
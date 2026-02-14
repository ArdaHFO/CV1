'use client';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Split by lines and process each line
  const lines = text.split('\n');
  
  const processLine = (line: string, index: number) => {
    // Process inline formatting
    let processedLine = line;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Combined regex for bold (**text**) and italic (*text*)
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      const matchedText = match[1];
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        // Bold
        const content = matchedText.slice(2, -2);
        parts.push(<strong key={`${index}-${match.index}`}>{content}</strong>);
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        // Italic
        const content = matchedText.slice(1, -1);
        parts.push(<em key={`${index}-${match.index}`}>{content}</em>);
      }
      
      lastIndex = match.index + matchedText.length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : line;
  };

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        
        // Check if line is a bullet point
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          const content = trimmedLine.substring(1).trim();
          return (
            <div key={index} className="flex gap-2 my-1">
              <span className="select-none">•</span>
              <span>{processLine(content, index)}</span>
            </div>
          );
        }
        
        // Check if line is a numbered list
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          const [, number, content] = numberedMatch;
          return (
            <div key={index} className="flex gap-2 my-1">
              <span className="select-none">{number}.</span>
              <span>{processLine(content, index)}</span>
            </div>
          );
        }
        
        // Regular line
        if (!trimmedLine) {
          return <br key={index} />;
        }
        
        return (
          <div key={index}>
            {processLine(line, index)}
          </div>
        );
      })}
    </div>
  );
}

export const segmentText = (text: string): string[] => {
  const segments: string[] = [];
  const MAX_LINES = 10;
  const MAX_CHARS_PER_LINE = 40;

  // 1. First, split into words while preserving single newlines
  const words = text.split(/(\s+)/);

  let currentSegment = '';
  let currentLines = 0;
  let currentLineLength = 0;

  words.forEach((word) => {
    const isNewline = word.includes('\n');

    if (isNewline) {
      // Handle explicit newlines in text
      const newlineCount = (word.match(/\n/g) || []).length;
      currentLines += newlineCount;
      currentSegment += word;
      currentLineLength = 0;
    } else {
      // If word fits on current line
      if (currentLineLength + word.length <= MAX_CHARS_PER_LINE) {
        currentSegment += word;
        currentLineLength += word.length;
      } else {
        // Word wraps to a new line
        currentLines += 1;
        currentSegment += word;
        currentLineLength = word.length;
      }
    }

    // Check if we hit the line limit
    if (currentLines >= MAX_LINES) {
      segments.push(currentSegment.trimEnd());
      currentSegment = '';
      currentLines = 0;
      currentLineLength = 0;
    }
  });

  if (currentSegment.length > 0) {
    segments.push(currentSegment.trimEnd());
  }

  return segments;
};

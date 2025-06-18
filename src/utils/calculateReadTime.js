/**
 * Calculate read time for a text content
 * @param {string} content - The text content
 * @returns {string} - Read time in format "X min read"
 */
const calculateReadTime = (content) => {
  if (!content) return '1 min read';
  
  // Remove HTML tags if present
  const plainText = content.replace(/<[^>]*>/g, ' ');
  
  // Calculate word count
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  
  // Average reading speed is 200-250 words per minute
  // We'll use 225 as a middle ground
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 225));
  
  return `${readTimeMinutes} min read`;
};

module.exports = calculateReadTime;

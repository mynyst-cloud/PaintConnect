import { startOfWeek, endOfWeek, eachWeekOfInterval, isSameDay, isWithinInterval } from 'date-fns';

/**
 * Calculate spans for all items (projects and events) across the calendar
 * @param {Array} items - Array of projects or events
 * @param {Date} calendarStart - Start of calendar view
 * @param {Date} calendarEnd - End of calendar view
 * @param {string} type - 'project' or 'event'
 * @returns {Array} Array of span objects with positioning info
 */
export function calculateItemSpans(items, calendarStart, calendarEnd, type) {
  const spans = [];
  
  // Get all weeks in the calendar view
  const weeks = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 1 } // Monday
  );

  items.forEach(item => {
    const itemStart = new Date(type === 'project' ? item.start_date : item.start_date);
    const itemEnd = new Date(type === 'project' ? item.expected_end_date : item.end_date);
    
    // Skip if item doesn't overlap with calendar view
    if (itemEnd < calendarStart || itemStart > calendarEnd) {
      return;
    }

    // For each week, check if item spans into it
    weeks.forEach((weekStart, weekIndex) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Check if item overlaps with this week
      if (itemEnd >= weekStart && itemStart <= weekEnd) {
        // Calculate visible start and end within this week
        const visibleStart = itemStart > weekStart ? itemStart : weekStart;
        const visibleEnd = itemEnd < weekEnd ? itemEnd : weekEnd;
        
        // Get day of week (0 = Monday, 6 = Sunday)
        const startDayOfWeek = visibleStart.getDay();
        const endDayOfWeek = visibleEnd.getDay();
        
        // Convert Sunday (0) to 6, and shift Monday-Saturday to 0-5
        const startColumn = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        const endColumn = endDayOfWeek === 0 ? 6 : endDayOfWeek - 1;
        
        spans.push({
          item,
          type,
          weekIndex,
          startColumn,
          endColumn,
          durationDays: endColumn - startColumn + 1,
          track: 0 // Will be assigned by overlap detection
        });
      }
    });
  });

  return spans;
}

/**
 * Detect overlaps and assign tracks to spans
 * @param {Array} spans - Array of span objects
 * @returns {Array} Spans with track assignments
 */
export function assignTracksToSpans(spans) {
  // Group spans by week
  const spansByWeek = {};
  spans.forEach(span => {
    if (!spansByWeek[span.weekIndex]) {
      spansByWeek[span.weekIndex] = [];
    }
    spansByWeek[span.weekIndex].push(span);
  });

  // For each week, assign tracks
  Object.keys(spansByWeek).forEach(weekIndex => {
    const weekSpans = spansByWeek[weekIndex];
    
    // Sort by start column, then by duration (longer first)
    weekSpans.sort((a, b) => {
      if (a.startColumn !== b.startColumn) {
        return a.startColumn - b.startColumn;
      }
      return b.durationDays - a.durationDays;
    });

    // Assign tracks using a greedy algorithm
    const tracks = []; // Each track holds the end column of the last item in that track
    
    weekSpans.forEach(span => {
      // Find the first available track
      let assignedTrack = -1;
      
      for (let i = 0; i < tracks.length; i++) {
        // Check if this span can fit in this track (no overlap)
        if (tracks[i] < span.startColumn) {
          assignedTrack = i;
          tracks[i] = span.endColumn;
          break;
        }
      }
      
      // If no track found, create a new one
      if (assignedTrack === -1) {
        assignedTrack = tracks.length;
        tracks.push(span.endColumn);
      }
      
      span.track = assignedTrack;
    });
  });

  return spans;
}

/**
 * Get the maximum track number for a given week
 * @param {Array} spans - Array of span objects with tracks assigned
 * @param {number} weekIndex - Week index to check
 * @returns {number} Maximum track number (0-indexed)
 */
export function getMaxTrackForWeek(spans, weekIndex) {
  const weekSpans = spans.filter(s => s.weekIndex === weekIndex);
  if (weekSpans.length === 0) return -1;
  return Math.max(...weekSpans.map(s => s.track));
}
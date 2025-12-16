import { useState, useCallback } from 'react';

/**
 * A hook to manage pagination state for client-side data.
 * It manages pagination parameters and provides filtered/paginated data.
 */
export function usePagination(allItems = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [items, setItems] = useState(allItems);

  // Calculate pagination values
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const offset = (currentPage - 1) * itemsPerPage;

  // Get paginated data
  const paginatedData = items.slice(offset, offset + itemsPerPage);

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  const handleSortByChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // Reset to first page on new sort
  }, []);

  const handleSortOrderChange = useCallback((newSortOrder) => {
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page on sort order change
  }, []);
  
  const getPageNumbers = useCallback(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1 && totalPages !== currentPage) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return {
    // Data
    paginatedData,
    items,
    setItems,
    
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    offset,
    totalPages,
    totalItems,
    
    // Search and Sort
    searchTerm,
    setSearchTerm: handleSearch,
    sortBy,
    setSortBy: handleSortByChange,
    sortOrder,
    setSortOrder: handleSortOrderChange,
    
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    getPageNumbers,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}
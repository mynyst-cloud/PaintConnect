import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, Trash2, Filter, Search, AlertCircle, Wifi, Code, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { errorTracker } from '@/components/utils/errorTracker';

const ErrorTypeIcons = {
  javascript: AlertCircle,
  promise_rejection: AlertCircle,
  console_error: Code,
  network_error: Wifi,
  react_error: Code,
  custom: ExternalLink
};

const ErrorTypeBadges = {
  javascript: 'bg-red-100 text-red-800',
  promise_rejection: 'bg-orange-100 text-orange-800',
  console_error: 'bg-yellow-100 text-yellow-800',
  network_error: 'bg-blue-100 text-blue-800',
  react_error: 'bg-purple-100 text-purple-800',
  custom: 'bg-gray-100 text-gray-800'
};

function ErrorItem({ error, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ErrorTypeIcons[error.type] || AlertCircle;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const copyErrorToClipboard = () => {
    const errorText = `
Error Type: ${error.type}
Message: ${error.message}
Timestamp: ${formatTimestamp(error.timestamp)}
URL: ${error.url || error.requestUrl || 'N/A'}
${error.stack ? `Stack Trace:\n${error.stack}` : ''}
${error.componentStack ? `Component Stack:\n${error.componentStack}` : ''}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      onCopy?.();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-gray-200 rounded-lg mb-2"
    >
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={ErrorTypeBadges[error.type] || ErrorTypeBadges.custom}>
                {error.type.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatTimestamp(error.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-900 truncate">{error.message}</p>
            {error.url && (
              <p className="text-xs text-gray-500 truncate mt-1">{error.url}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              copyErrorToClipboard();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 bg-gray-50 overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {error.stack && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Stack Trace:</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
              
              {error.componentStack && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Component Stack:</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
                    {error.componentStack}
                  </pre>
                </div>
              )}

              {error.metadata && Object.keys(error.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Metadata:</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(error.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyErrorToClipboard}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Full Error
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DebugPanel({ isOpen, onClose }) {
  const [errors, setErrors] = useState([]);
  const [filteredErrors, setFilteredErrors] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({});
  const [copyFeedback, setCopyFeedback] = useState(false);

  const refreshData = () => {
    const allErrors = errorTracker.getErrors();
    const errorStats = errorTracker.getErrorStats();
    setErrors(allErrors);
    setStats(errorStats);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      
      // Subscribe to new errors
      const unsubscribe = errorTracker.addListener(() => {
        refreshData();
      });
      
      return unsubscribe;
    }
  }, [isOpen]);

  // Filter and search errors
  useEffect(() => {
    let filtered = errors;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(error => error.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(error =>
        error.message.toLowerCase().includes(query) ||
        (error.stack && error.stack.toLowerCase().includes(query)) ||
        (error.url && error.url.toLowerCase().includes(query))
      );
    }

    setFilteredErrors(filtered);
  }, [errors, typeFilter, searchQuery]);

  const errorTypes = useMemo(() => {
    const types = [...new Set(errors.map(error => error.type))];
    return types.sort();
  }, [errors]);

  const handleClearErrors = () => {
    if (window.confirm('Are you sure you want to clear all errors?')) {
      errorTracker.clearErrors();
      refreshData();
    }
  };

  const handleExportErrors = () => {
    errorTracker.downloadErrorsAsJson();
  };

  const handleCopyFeedback = () => {
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Debug Panel</h2>
            <p className="text-sm text-gray-500 mt-1">
              {stats.total} total errors • {stats.last24Hours} in last 24h • {stats.lastHour} in last hour
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportErrors}>
              <Download className="w-4 h-4 mr-1" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearErrors}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        {Object.keys(stats.byType || {}).length > 0 && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge key={type} className={ErrorTypeBadges[type] || ErrorTypeBadges.custom}>
                  {type.replace('_', ' ')}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 border-b bg-white">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search errors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {errorTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error List */}
        <div className="flex-1 overflow-y-auto p-4">
          {copyFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm"
            >
              Error copied to clipboard!
            </motion.div>
          )}

          {filteredErrors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {errors.length === 0 ? (
                <div>
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No errors tracked</p>
                  <p className="text-sm">Great! Your app is running smoothly.</p>
                </div>
              ) : (
                <div>
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No errors match your filters</p>
                  <p className="text-sm">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredErrors.map(error => (
                  <ErrorItem 
                    key={error.id} 
                    error={error}
                    onCopy={handleCopyFeedback}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Session: {errorTracker.sessionId}</span>
            <span>Press Ctrl+D to close</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
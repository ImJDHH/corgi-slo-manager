/**
 * Utilities Module for Corgi SLO Manager
 * Contains various helper functions used throughout the application.
 */

const Utils = (function() {
    /**
     * Format a date string to a human-readable format
     * @param {string} dateString - ISO date string
     * @param {boolean} [includeTime=false] - Whether to include time
     * @returns {string} Formatted date string
     */
    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return date.toLocaleDateString(undefined, options);
    };
    
    /**
     * Format a relative time (e.g., "2 days ago")
     * @param {string} dateString - ISO date string
     * @returns {string} Relative time string
     */
    const formatRelativeTime = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffMonth / 12);
        
        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffDay < 30) {
            return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
        } else if (diffMonth < 12) {
            return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
        } else {
            return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
        }
    };
    
    /**
     * Truncate a string to a specified length
     * @param {string} str - String to truncate
     * @param {number} [length=50] - Maximum length
     * @returns {string} Truncated string
     */
    const truncateString = (str, length = 50) => {
        if (!str) return '';
        
        if (str.length <= length) {
            return str;
        }
        
        return `${str.substring(0, length)}...`;
    };
    
    /**
     * Debounce a function to limit how often it can be called
     * @param {Function} func - Function to debounce
     * @param {number} [wait=300] - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    const debounce = (func, wait = 300) => {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    /**
     * Throttle a function to limit how often it can be called
     * @param {Function} func - Function to throttle
     * @param {number} [limit=300] - Limit in milliseconds
     * @returns {Function} Throttled function
     */
    const throttle = (func, limit = 300) => {
        let inThrottle;
        
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
        };
    };
    
    /**
     * Generate a URL-friendly slug from a string
     * @param {string} str - String to slugify
     * @returns {string} Slugified string
     */
    const slugify = (str) => {
        if (!str) return '';
        
        return str
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };
    
    /**
     * Parse URL parameters
     * @param {string} [url=window.location.href] - URL to parse
     * @returns {Object} Object containing URL parameters
     */
    const parseUrlParams = (url = window.location.href) => {
        const params = {};
        const parser = document.createElement('a');
        parser.href = url;
        
        const query = parser.search.substring(1);
        const vars = query.split('&');
        
        for (let i = 0; i < vars.length; i++) {
            const pair = vars[i].split('=');
            
            if (pair[0]) {
                params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
        }
        
        return params;
    };
    
    /**
     * Get element data attributes as an object
     * @param {HTMLElement} element - DOM element
     * @returns {Object} Data attributes object
     */
    const getDataAttributes = (element) => {
        const data = {};
        
        for (const key in element.dataset) {
            if (Object.prototype.hasOwnProperty.call(element.dataset, key)) {
                data[key] = element.dataset[key];
            }
        }
        
        return data;
    };
    
    /**
     * Format a percentage
     * @param {number} value - Value to format
     * @param {number} [decimals=2] - Number of decimal places
     * @returns {string} Formatted percentage
     */
    const formatPercentage = (value, decimals = 2) => {
        if (value === null || value === undefined) return '';
        
        return `${parseFloat(value).toFixed(decimals)}%`;
    };
    
    /**
     * Format a number with thousands separators
     * @param {number} value - Value to format
     * @param {number} [decimals=0] - Number of decimal places
     * @returns {string} Formatted number
     */
    const formatNumber = (value, decimals = 0) => {
        if (value === null || value === undefined) return '';
        
        return parseFloat(value).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };
    
    /**
     * Calculate the date range based on a time range string
     * @param {string} timeRange - Time range (e.g., 'last7days', 'last30days')
     * @returns {Object} Start and end dates
     */
    const calculateDateRange = (timeRange) => {
        const end = new Date();
        let start = new Date();
        
        switch (timeRange) {
            case 'last7days':
                start.setDate(start.getDate() - 7);
                break;
            case 'last30days':
                start.setDate(start.getDate() - 30);
                break;
            case 'last90days':
                start.setDate(start.getDate() - 90);
                break;
            case 'lastYear':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setDate(start.getDate() - 30); // Default to 30 days
        }
        
        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    };
    
    /**
     * Generate a random hex color
     * @returns {string} Random hex color
     */
    const randomColor = () => {
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    };
    
    /**
     * Download data as a JSON file
     * @param {Object} data - Data to download
     * @param {string} [filename='export.json'] - Filename
     */
    const downloadJson = (data, filename = 'export.json') => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    };
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<void>}
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy text:', error);
            
            // Fallback for older browsers
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);
                return false;
            }
        }
    };
    
    /**
     * Sanitize HTML to prevent XSS attacks
     * @param {string} html - HTML to sanitize
     * @returns {string} Sanitized HTML
     */
    const sanitizeHtml = (html) => {
        if (!html) return '';
        
        const element = document.createElement('div');
        element.textContent = html;
        return element.innerHTML;
    };
    
    /**
     * Create a DOM element with attributes and children
     * @param {string} tag - Element tag name
     * @param {Object} [attrs={}] - Element attributes
     * @param {Array|string|HTMLElement} [children] - Child elements or text
     * @returns {HTMLElement} Created element
     */
    const createElement = (tag, attrs = {}, children) => {
        const element = document.createElement(tag);
        
        // Set attributes
        for (const key in attrs) {
            if (key === 'className') {
                element.className = attrs[key];
            } else if (key === 'style' && typeof attrs[key] === 'object') {
                Object.assign(element.style, attrs[key]);
            } else if (key.startsWith('on') && typeof attrs[key] === 'function') {
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, attrs[key]);
            } else {
                element.setAttribute(key, attrs[key]);
            }
        }
        
        // Add children
        if (children) {
            if (Array.isArray(children)) {
                children.forEach(child => {
                    if (child instanceof Node) {
                        element.appendChild(child);
                    } else if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    }
                });
            } else if (children instanceof Node) {
                element.appendChild(children);
            } else if (typeof children === 'string') {
                element.textContent = children;
            }
        }
        
        return element;
    };
    
    /**
     * Get the status display properties for a given status
     * @param {string} status - Status string (e.g., 'active', 'pending', 'rejected')
     * @returns {Object} Object with icon, color, and label
     */
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'active':
                return {
                    icon: 'check_circle',
                    color: 'var(--success-color)',
                    label: 'Active',
                    class: 'tag-success'
                };
            case 'pending':
                return {
                    icon: 'hourglass_empty',
                    color: 'var(--warning-color)',
                    label: 'Pending Approval',
                    class: 'tag-warning'
                };
            case 'rejected':
                return {
                    icon: 'cancel',
                    color: 'var(--error-color)',
                    label: 'Rejected',
                    class: 'tag-error'
                };
            case 'draft':
                return {
                    icon: 'edit',
                    color: 'var(--text-tertiary)',
                    label: 'Draft',
                    class: 'tag-neutral'
                };
            case 'archived':
                return {
                    icon: 'archive',
                    color: 'var(--text-tertiary)',
                    label: 'Archived',
                    class: 'tag-neutral'
                };
            default:
                return {
                    icon: 'help_outline',
                    color: 'var(--text-tertiary)',
                    label: status || 'Unknown',
                    class: 'tag-neutral'
                };
        }
    };
    
    // Public API
    return {
        formatDate,
        formatRelativeTime,
        truncateString,
        debounce,
        throttle,
        slugify,
        parseUrlParams,
        getDataAttributes,
        formatPercentage,
        formatNumber,
        calculateDateRange,
        randomColor,
        downloadJson,
        copyToClipboard,
        sanitizeHtml,
        createElement,
        getStatusDisplay
    };
})(); 
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Generate a unique voucher code with prefix
 * @param {string} prefix - Prefix for the voucher code (e.g., 'IND', 'CORP', 'BULK')
 * @returns {string} Formatted voucher code
 */
export function generateVoucherCode(prefix = 'VCH') {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 8).toUpperCase();
	return `${prefix}-${timestamp}-${random}`;
}

/**
 * Centralized error handler for consistent error messaging
 * @param {Error} error - The error object
 * @param {Function} toast - Toast function from useToast
 * @param {string} defaultMessage - Default error message
 */
export function handleError(error, toast, defaultMessage = 'An error occurred') {
	console.error('Error:', error);
	toast({
		variant: "destructive",
		title: "Error",
		description: error.message || defaultMessage
	});
}

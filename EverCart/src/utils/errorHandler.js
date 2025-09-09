// Error handling utilities
export const handleApiError = (error, context = '') => {
  console.error(`API Error ${context}:`, error)
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  
  if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
    return 'Please login to continue.'
  }
  
  if (error.message?.includes('403') || error.message?.includes('forbidden')) {
    return 'You do not have permission to perform this action.'
  }
  
  if (error.message?.includes('404')) {
    return 'The requested resource was not found.'
  }
  
  if (error.message?.includes('500')) {
    return 'Server error. Please try again later.'
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}

export const handleLocalStorageError = (error, operation = '') => {
  console.error(`LocalStorage Error ${operation}:`, error)
  
  if (error.name === 'QuotaExceededError') {
    return 'Storage is full. Please clear some data and try again.'
  }
  
  if (error.name === 'SecurityError') {
    return 'Storage access denied. Please check your browser settings.'
  }
  
  return 'Failed to save data. Please try again.'
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

export const validateRequired = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]?.trim())
  return missing
}

export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('JSON parse error:', error)
    return fallback
  }
}

export const safeJsonStringify = (data, fallback = '[]') => {
  try {
    return JSON.stringify(data)
  } catch (error) {
    console.error('JSON stringify error:', error)
    return fallback
  }
}

// import { clsx } from "clsx";
// import { twMerge } from "tailwind-merge"

// export function cn(...inputs) {
//   return twMerge(clsx(inputs));
// }

// export const formatCurrency = (amount) => {
//   const formatter = new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "INR",
//   });

//   return formatter.format(amount);
// }

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from "date-fns"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatDate = (date, formatStr = "PPP") => {
  if (!date) return ""
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export const formatRelativeTime = (date) => {
  if (!date) return ""
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

// Currency formatting
export const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Number formatting
export const formatNumber = (num) => {
  return new Intl.NumberFormat("en-IN").format(num)
}

// Status color utilities
export const getStatusColor = (status) => {
  const statusColors = {
    // Trip statuses
    booked: "bg-blue-100  text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    billed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",

    // Vehicle statuses
    available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",

    // Payment statuses
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",

    // Maintenance statuses
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",

    // Priority levels
    low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  return statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
}

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(phone)
}

export const isValidPincode = (pincode) => {
  const pincodeRegex = /^[0-9]{6}$/
  return pincodeRegex.test(pincode)
}

// Text utilities
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const formatVehicleType = (type) => {
  const typeMap = {
    truck: "Truck",
    tempo: "Tempo",
    mini_truck: "Mini Truck",
    trailer: "Trailer",
    container: "Container",
  }
  return typeMap[type] || type
}

export const formatUserRole = (role) => {
  const roleMap = {
    admin: "Admin",
    fleet_owner: "Fleet Owner",
    client: "Client",
    driver: "Driver",
  }
  return roleMap[role] || role
}

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = (groups[item[key]] || [])
    group.push(item)
    groups[item[key]] = group
    return groups
  }, {} )
}

// Local storage utilities
export const getFromStorage = (key) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error)
      return null
    }
  }
  return null
}

export const setToStorage = (key, value) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting ${key} to localStorage:`, error)
    }
  }
}

export const removeFromStorage = (key) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
    }
  }
}

// Permission utilities
export const hasPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole)
}

// export const canAccessRoute = (userRole, route) => {
//   const routePermissions = {
//     '/dashboard/': [\'admin\', \'fleet_owner\', \'client\', \'driver\'],
//     '/users': ['admin'],
//     '/vehicles': ['admin', 'fleet_owner'],
//     '/trips': ['admin', 'fleet_owner', 'client', 'driver'],
//     '/payments': ['admin', 'fleet_owner', 'client'],
//     '/maintenance': ['admin', 'fleet_owner'],
//     '/reports': ['admin', 'fleet_owner'],
//   }
  
//   const allowedRoles = routePermissions[route] || []
//   return allowedRoles.includes(userRole)
// }

// Error handling utilities
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Debounce utility\
export const debounce = (
  func,
  wait
) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Download file utility
export const downloadFile = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

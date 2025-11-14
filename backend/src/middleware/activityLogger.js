const ActivityLog = require('../models/ActivityLog');
const catchAsync = require('../utils/catchAsync');

// General activity logger
const logActivity = async ({
  user,
  action,
  category,
  description,
  details = {},
  relatedTrip,
  relatedUser,
  relatedVehicle,
  relatedPayment,
  severity = 'medium',
  date,
  req
}) => {
  try {
    console.log('📝 logActivity called with:', { user, action, category, description });
    
    const logData = {
      user,
      action,
      category,
      description,
      details: {
        ...details,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        timestamp: new Date()
      },
      severity,
      createdAt: date || new Date()
    };

    // Add related entities if provided
    if (relatedTrip) logData.relatedTrip = relatedTrip;
    if (relatedUser) logData.relatedUser = relatedUser;
    if (relatedVehicle) logData.relatedVehicle = relatedVehicle;
    if (relatedPayment) logData.relatedPayment = relatedPayment;

    console.log('💾 Saving activity log to database:', logData);
    const savedLog = await ActivityLog.create(logData);
    console.log('✅ Activity log saved successfully:', savedLog._id);
  } catch (error) {
    console.error('❌ Activity logging failed:', error);
    // Don't throw error to avoid breaking main functionality
  }
};

// Middleware for automatic activity logging
const activityLogger = (options = {}) => {
  return catchAsync(async (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract activity details from request
        const activityData = {
          user: req.user?._id,
          action: getActionFromRequest(req),
          category: getCategoryFromRequest(req),
          description: getDescriptionFromRequest(req, data),
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            ...extractDetailsFromRequest(req, data)
          },
          req
        };

        // Add related entities based on request data
        if (data?.data?.trip?._id) activityData.relatedTrip = data.data.trip._id;
        if (data?.data?.user?._id) activityData.relatedUser = data.data.user._id;
        if (data?.data?.vehicle?._id) activityData.relatedVehicle = data.data.vehicle._id;
        if (data?.data?.payment?._id) activityData.relatedPayment = data.data.payment._id;

        // Log activity asynchronously
        logActivity(activityData).catch(err => 
          console.error('Auto-logging failed:', err)
        );
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  });
};

// Helper functions to extract activity information
const getActionFromRequest = (req) => {
  const { method, path } = req;
  
  if (method === 'POST') {
    if (path.includes('login')) return 'user_login';
    if (path.includes('register')) return 'user_register';
    if (path.includes('trip')) return 'trip_create';
    if (path.includes('payment')) return 'payment_create';
    if (path.includes('advance')) return 'advance_create';
    if (path.includes('expense')) return 'expense_create';
    return 'create';
  }
  
  if (method === 'PUT' || method === 'PATCH') {
    if (path.includes('trip')) return 'trip_update';
    if (path.includes('payment')) return 'payment_update';
    if (path.includes('user')) return 'user_update';
    return 'update';
  }
  
  if (method === 'DELETE') {
    if (path.includes('trip')) return 'trip_delete';
    if (path.includes('payment')) return 'payment_delete';
    return 'delete';
  }
  
  return 'view';
};

const getCategoryFromRequest = (req) => {
  const { path } = req;
  
  if (path.includes('auth') || path.includes('login') || path.includes('register')) return 'authentication';
  if (path.includes('trip')) return 'trip_management';
  if (path.includes('payment')) return 'financial';
  if (path.includes('advance') || path.includes('expense')) return 'financial';
  if (path.includes('vehicle')) return 'vehicle_management';
  if (path.includes('user')) return 'user_management';
  if (path.includes('maintenance')) return 'maintenance';
  
  return 'general';
};

const getDescriptionFromRequest = (req, data) => {
  const action = getActionFromRequest(req);
  const category = getCategoryFromRequest(req);
  
  // Generate description based on action and category
  if (action === 'user_login') return 'User logged in';
  if (action === 'user_register') return 'New user registered';
  if (action === 'trip_create') return `New trip created: ${data?.data?.trip?.tripNumber || 'Unknown'}`;
  if (action === 'payment_create') return `Payment created: ₹${data?.data?.payment?.amount || 'Unknown'}`;
  if (action === 'advance_create') return `Advance created: ₹${data?.data?.advance?.amount || 'Unknown'}`;
  
  return `${action.replace('_', ' ')} performed in ${category.replace('_', ' ')}`;
};

const extractDetailsFromRequest = (req, data) => {
  const details = {};
  
  // Extract relevant details based on the request
  if (req.body?.amount) details.amount = req.body.amount;
  if (req.body?.tripNumber) details.tripNumber = req.body.tripNumber;
  if (req.body?.paymentType) details.paymentType = req.body.paymentType;
  if (req.body?.vehicleNumber) details.vehicleNumber = req.body.vehicleNumber;
  
  // Extract from response data
  if (data?.data?.trip?.tripNumber) details.tripNumber = data.data.trip.tripNumber;
  if (data?.data?.payment?.amount) details.amount = data.data.payment.amount;
  if (data?.data?.payment?.paymentNumber) details.paymentNumber = data.data.payment.paymentNumber;
  
  return details;
};

// Authentication-specific logger
const authLogger = async ({
  user,
  action,
  description,
  details = {},
  req
}) => {
  return logActivity({
    user,
    action,
    category: 'authentication',
    description,
    details,
    severity: 'info',
    req
  });
};

module.exports = {
  logActivity,
  activityLogger,
  authLogger
};
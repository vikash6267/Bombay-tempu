import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
console.log(API_BASE_URL)
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// Generic API functions
const apiGet = async (url, params) => {
  const response = await api.get(url, {params});
  return response.data;
};

const apiPost = async (url, data) => {
  const response = await api.post(url, data);
  return response.data;
};

const apiPut = async (url, data) => {
  const response = await api.put(url, data);
  return response.data;
};

const apiPatch = async (url, data) => {
  const response = await api.patch(url, data);
  return response.data;
};

const apiDelete = async (url) => {
  const response = await api.delete(url);
  return response.data;
};

// File upload function
const apiUpload = async (url, formData) => {
  const response = await api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Authentication API
export const authApi = {
  login: async (data) => {
    const res = await apiPost("/auth/login", data);

    return res;
  },
  register: (data) => apiPost("/auth/register", data),
  logout: async () => {
    const res = await apiPost("/auth/logout");
    return res;
  },
  forgotPassword: (data) => apiPost("/auth/forgot-password", data),
  resetPassword: (token, data) =>
    apiPatch(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => apiGet(`/auth/verify-email/${token}`),
  getMe: () => apiGet("/auth/me"),
  updatePassword: (data) => apiPatch("/auth/update-password", data),
};

// Users API
export const usersApi = {
  getAll: (params) => apiGet("/users", params),
  getById: (id) => apiGet(`/users/${id}`),
  create: (data) => apiPost("/users/create", data),
  create: (data) => apiPost("/users", data),
  update: (id, data) => apiPatch(`/users/${id}`, data),
  delete: (id) => apiDelete(`/users/${id}`),
  getProfile: () => apiGet("/users/profile"),
  updateProfile: (data) => apiPatch("/users/profile", data),
  uploadProfilePhoto: (formData) => apiUpload("/users/profile/photo", formData),
  activate: (id) => apiPatch(`/users/${id}/activate`),
  deactivate: (id) => apiPatch(`/users/${id}/deactivate`),
  userDetails: (id) => apiGet(`/auth/trip-balances/${id}`),
  driverDetails: (id) => apiGet(`/trips/driver-summary/${id}`),
    getAdujstmetn: (clientId) => apiGet(`/trips/argestment/${clientId}`),
    payAdjustment: (clientId, amount) =>
  apiPatch(`/trips/argestment/${clientId}/pay`, { amount }),



};

// Vehicles API
export const vehiclesApi = {
  getAll: (params) => apiGet("/vehicles", params),
  getById: (id) => apiGet(`/vehicles/${id}`),
  create: (data) => apiPost("/vehicles", data),
  update: (id, data) => apiPatch(`/vehicles/${id}`, data),
  delete: (id) => apiDelete(`/vehicles/${id}`),
  uploadDocument: (id, formData) =>
    apiUpload(`/vehicles/${id}/documents`, formData),
  getMaintenanceRecords: (id) => apiGet(`/vehicles/${id}/maintenance`),
  getExpiringDocuments: (params) =>
    apiGet("/vehicles/expiring-documents", params),
  getEMIDue: () => apiGet("/vehicles/emi-due"),
  getExpenses: (id) => apiGet(`/auth/${id}/expenses`),

  getFinace: (id, params) => apiGet(`/vehicles/${id}/finace`, params),

};

// Trips API
export const tripsApi = {
  getAll: (params) => apiGet("/trips", params),
  getById: (id) => apiGet(`/trips/${id}`),
  create: (data) => apiPost("/trips", data),
  update: (id, data) => apiPatch(`/trips/${id}`, data),
  delete: (id) => apiDelete(`/trips/${id}`),
  getStats: () => apiGet("/trips/stats"),
  getMyTrips: (params) => apiGet("/trips/my-trips", params),
  updateStatus: (id, data) => apiPatch(`/trips/${id}/status`, data),
  addAdvance: (id, data) => apiPost(`/trips/${id}/advance`, data),
  deleteAdvance: (id, data) => apiPost(`/trips/${id}/del-advance`, data),
  addExpense: (id, data) => apiPost(`/trips/${id}/expense`, data),
  deleteExpense: (id, data) => apiPost(`/trips/${id}/del-expense`, data),
  uploadDocument: (id, formData) =>
    apiUpload(`/trips/${id}/documents`, formData),
   addFleetAdvance: (id, data) => apiPost(`/trips/${id}/fleet-advance`, data), // 👈 singular
   deleteFleetAdvance: (id, data) => apiPost(`/trips/${id}/del-fleet-advance`, data), // 👈 singular
addFleetExpense: (id, data) => apiPost(`/trips/${id}/fleet-expense`, data), // 👈 singular

 // ✅ Add self expense and advance
  addSelfExpense: (id, data) => apiPost(`/trips/${id}/self-expense`, data),
  deleteSelfExpense: (id, data) => apiPost(`/trips/${id}/del-self-expense`, data),
  addSelfAdvance: (id, data) => apiPost(`/trips/${id}/self-advance`, data),
  deleteSelfAdvance: (id, data) => apiPost(`/trips/${id}/del-self-advance`, data),
    updatePodDetails: (id, data) => apiPut(`/trips/${id}/pod-details`, data),
    updatePodStatus: (id, data) => apiPut(`/trips/pod-status/${id}`, data),
    updatePodDocs: (id, data) => apiPost(`/trips/${id}/podDocument`, data),
   
    clientupdatePodStatus: (id,clientid, data) => apiPut(`/trips/client-pod-status/${id}/${clientid}`, data),
    clientupdatePodDocs: (id, data) => apiPost(`/trips/${id}/client/podDocument`, data),
  
  
  
  
  
    getDashboard: () => apiGet("/auth/dashboard"),


};

// Payments API
export const paymentsApi = {
  getAll: (params) => apiGet("/payments", params),
  getById: (id) => apiGet(`/payments/${id}`),
  create: (data) => apiPost("/payments", data),
  update: (id, data) => apiPatch(`/payments/${id}`, data),
  delete: (id) => apiDelete(`/payments/${id}`),
  getStats: () => apiGet("/payments/stats"),
  getOutstanding: () => apiGet("/payments/outstanding"),
  getMyPayments: (params) => apiGet("/payments/my-payments", params),
  approve: (id) => apiPatch(`/payments/${id}/approve`),
  cancel: (id, data) => apiPatch(`/payments/${id}/cancel`, data),
  uploadDocument: (id, formData) =>
    apiUpload(`/payments/${id}/documents`, formData),
};

// Maintenance API
export const maintenanceApi = {
  getAll: (params) => apiGet("/maintenance", params),
  getById: (id) => apiGet(`/maintenance/${id}`),
  create: (data) => apiPost("/maintenance", data),
  update: (id, data) => apiPatch(`/maintenance/${id}`, data),
  delete: (id) => apiDelete(`/maintenance/${id}`),
  getUpcoming: (params) => apiGet("/maintenance/upcoming", params),
  getStats: () => apiGet("/maintenance/stats"),
  complete: (id) => apiPatch(`/maintenance/${id}/complete`),
  uploadDocument: (id, formData) =>
    apiUpload(`/maintenance/${id}/documents`, formData),
};

// Reports API
export const reportsApi = {
  getDashboard: () => apiGet("/reports/dashboard"),
  getFinancial: (params) => apiGet("/reports/financial", params),
  getOperational: (params) => apiGet("/reports/operational", params),
  getVehiclePerformance: (params) =>
    apiGet("/reports/vehicle-performance", params),
};





export const expensesApi = {
  getAll: (params) => apiGet("/expenses/getAll", params),
  delete: (params) => apiDelete(`/expenses/delete/${params}`, params),
  create: (data) => apiPost("/expenses/create", data),
  update: (id, data) => apiPatch(`/expenses/edit/${id}`, data),


};
export default api;

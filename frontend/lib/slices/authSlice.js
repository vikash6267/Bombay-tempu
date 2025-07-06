import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.data.user
      state.token = action.payload.token
      state.error = null

      // Store in localStorage
      localStorage.setItem("token", action.payload.token)
      localStorage.setItem("user", JSON.stringify(action.payload.data.user))
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null

      // Remove from localStorage
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem("user", JSON.stringify(state.user))
    },
    clearError: (state) => {
      state.error = null
    },
    initializeAuth: (state) => {
      // Initialize from localStorage
      const token = localStorage.getItem("token")
      const user = localStorage.getItem("user")

      if (token && user) {
        state.token = token
        state.user = JSON.parse(user)
        state.isAuthenticated = true
      }
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, clearError, initializeAuth } =
  authSlice.actions

export default authSlice.reducer

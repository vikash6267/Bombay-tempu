import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import uiSlice from "./slices/uiSlice"
import citySlice from "./slices/citySlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    city : citySlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export default store

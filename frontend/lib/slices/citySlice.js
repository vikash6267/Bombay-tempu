import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  cities: [],
  loading: false,
  error: null,
}

const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    getCitiesStart: (state) => {
      state.loading = true
      state.error = null
    },
    getCitiesSuccess: (state, action) => {
      state.loading = false
      state.cities = action.payload
      state.error = null
    },
    getCitiesFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
  },
})

export const {
  getCitiesStart,
  getCitiesSuccess,
  getCitiesFailure,
} = citySlice.actions
export default citySlice.reducer

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/types"

interface UserState {
  users: User[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
}

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload
    },
    setPagination: (state, action: PayloadAction<UserState["pagination"]>) => {
      state.pagination = action.payload
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.unshift(action.payload)
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex((user) => user._id === action.payload._id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter((user) => user._id !== action.payload)
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setLoading, setUsers, setPagination, addUser, updateUser, deleteUser, setError } = userSlice.actions
export default userSlice.reducer

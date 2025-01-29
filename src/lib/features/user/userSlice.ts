import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'; // Import js-cookie

interface UserState {
  id: number;
  name: string;
  role_id: string;
}

const initialState: UserState = {
  id: 0,
  name: "",
  role_id: ""
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.role_id = action.payload.role_id;
    },
    logout(state) {
      state.id = 0;
      state.name = "";
      state.role_id = "";

      // Clear the user cookie on logout
      Cookies.remove('user');
    }
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;

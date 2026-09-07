import apiClient from "./services.js";

const AuthServices = {
  loginUser(data) {
    return apiClient.post("login", data);
  },

  registerUser(data) {
    return apiClient.post("register", data);
  },

  logoutUser() {
    return apiClient.post("logout");
  },
};

export default AuthServices;

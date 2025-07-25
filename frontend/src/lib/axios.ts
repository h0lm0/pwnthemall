import axios from "axios";

let accessToken: string | null = null;

export const setToken = (token: string | null) => {
  accessToken = token;
};

const instance = axios.create({
  withCredentials: true,
});

instance.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default instance;

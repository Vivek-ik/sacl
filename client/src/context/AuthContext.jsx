import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../lib/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sacl_user"));
    } catch {
      return null;
    }
  });
  async function login(identifier, password) {
    const { data } = await api.post("/auth/login", { identifier: identifier, password });
    localStorage.setItem("sacl_token", data.token);
    localStorage.setItem("sacl_user", JSON.stringify(data.user));
    setUser(data.user);
  }
  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("sacl_token", data.token);
    localStorage.setItem("sacl_user", JSON.stringify(data.user));
    setUser(data.user);
  }
  function logout() {
    localStorage.removeItem("sacl_token");
    localStorage.removeItem("sacl_user");
    setUser(null);
  }
  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

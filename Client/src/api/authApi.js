import {AUTH_API} from "./api";

export const loginUser = async (data) => {
  const res = await AUTH_API.post("/login/", data);
  return res.data;
};


export const registerUser = async (data) => {
  const res = await AUTH_API.post("/register/", data, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};


export const logoutUser = async () => {
  try {
    const refresh = localStorage.getItem("refresh");

    const res = await AUTH_API.post("/logout/", {
      refresh: refresh,
    });

    return res.data;
  } catch (err) {
    return { success: false };
  }
};


export const getSettings = () => AUTH_API.get("/admin/settings/");

export const updateSettings = (data) =>
  AUTH_API.put("/admin/settings/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }); 


export const getProfile = () => AUTH_API.get("/admin/profile/");

export const updateProfile = (data) =>
  AUTH_API.put("/admin/profile/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  export default AUTH_API;
  

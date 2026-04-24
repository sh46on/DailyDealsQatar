import {AUTH_API} from "./api";

export const getUsers = () => AUTH_API.get("/admin/users/");
export const createUser = (data) => AUTH_API.post("/admin/users/", data);
export const updateUser = (id, data) => AUTH_API.patch(`/admin/users/${id}/`, data);
export const deleteUser = (id) => AUTH_API.delete(`/admin/users/${id}/`);
export const toggleUser = (id) => AUTH_API.patch(`/admin/users/${id}/toggle/`);


export const getCurrentUser = () =>
  AUTH_API.get("/user/company/");
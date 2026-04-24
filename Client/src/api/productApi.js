import {AUTH_API} from "./api";

export const getProducts = () => AUTH_API.get("/admin/products/");
export const toggleProduct = (id) =>
  AUTH_API.patch(`/admin/products/${id}/toggle/`);
export const toggleFeatured = (id) =>
  AUTH_API.patch(`/admin/products/${id}/feature/`);
export const deleteProduct = (id) =>
  AUTH_API.delete(`/admin/products/${id}/delete/`);
import AUTH_API from "./authApi";

export const getCategories = () => AUTH_API.get("/admin/categories/");
export const createCategory = (data) =>
  AUTH_API.post("/admin/categories/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateCategory = (id, data) =>
  AUTH_API.put(`/admin/categories/${id}/`, data);

export const deleteCategory = (id) =>
  AUTH_API.delete(`/admin/categories/${id}/`);

export const createSubCategory = (data) =>
  AUTH_API.post("/admin/subcategories/", data);

export const updateSubCategory = (id, data) =>
  AUTH_API.put(`/admin/subcategories/${id}/`, data);

export const deleteSubCategory = (id) =>
  AUTH_API.delete(`/admin/subcategories/${id}/`);
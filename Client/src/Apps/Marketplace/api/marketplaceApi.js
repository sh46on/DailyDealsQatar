import {API_URL} from "../../../api/api"


// ================= HOME PRODUCTS =================
export const fetchHomeProducts = async (params = {}) => {
  const res = await API_URL.get("/marketplace/home/products/", { params });
  return res.data;
};

// ================= PRODUCTS =================
export const fetchProducts = async (params = {}) => {
  const res = await API_URL.get("/marketplace/products/", { params });
  return res.data;
};


// ================= NOTIFICATIONS =================
export const fetchNotifications = async () => {
  const res = await API_URL.get("/marketplace/notifications/");
  return res.data;
};

export const updateRequestStatus = (id, status) =>
  API_URL.post(`/marketplace/notifications/status/${id}/`, { status });

export const markNotificationRead = async (id) => {
  const res = await API_URL.post(`/marketplace/notifications/read/${id}/`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await API_URL.post("/marketplace/notifications/read-all/");
  return res.data;
};


// ================= SAVED =================
export const fetchSavedProducts = async () => {
  const res = await API_URL.get("/marketplace/saved-products/");
  return res.data;
};

export const toggleSaveProduct = async (id) => {
  const res = await API_URL.post(`/marketplace/toggle-save/${id}/`);
  return res.data;
};


// ================= REQUEST =================

// SINGLE CLEAN API
export const requestProduct = async (productId) => {
  const res = await API_URL.post("/marketplace/request/", {
    product_id: productId,
  });
  return res.data;
};

// FIXED (GET, not POST)
export const fetchRequestedProducts = () => 
  API_URL.get("/marketplace/requested/");

export const fetchMyInterests = async () => {
  const res = await API_URL.get("/marketplace/my-interests/");
  return res.data;
};


// ================= PROFILE =================
export const fetchProfile = async () => {
  const res = await API_URL.get("/marketplace/profile/");
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await API_URL.put("/marketplace/profile/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};


// ================= SELLER =================
export const fetchSellerProducts = async () => {
  const res = await API_URL.get("/marketplace/seller/products/");
  return res.data;
};

export const createProduct = async (data) => {
  const res = await API_URL.post("/marketplace/seller/products/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await API_URL.put(`/marketplace/seller/products/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await API_URL.delete(`/marketplace/seller/products/${id}/`);
  return res.data;
};

export const toggleProductStatus = async (id) => {
  const res = await API_URL.post(`/marketplace/seller/products/${id}/toggle/`);
  return res.data;
};


// ================= CART =================
export const addToCart = async (productId) => {
  const res = await API_URL.post("/marketplace/cart/", {
    product_id: productId,
  });
  return res.data;
};

export const removeFromCart = async (productId) => {
  const res = await API_URL.delete(`/marketplace/cart/${productId}/`);
  return res.data;
};


export const fetchCart = () =>
  API_URL.get("/marketplace/cart/");
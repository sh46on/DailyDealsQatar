import {AUTH_API, API_URL} from "../../api/api";

export const getCompanyDashboard = () =>
  AUTH_API.get("/company/dashboard/");

export const getCompanyProducts = () =>
  AUTH_API.get("/company/products/");

export const getCompanyFlyers = () =>
  AUTH_API.get("/company/flyers/");


export const updateCompanyProfile = (formData) =>
  AUTH_API.put("/company/profile/update/", formData);



const BASE_API = API_URL



export const updateFlyer = (id, data) =>
    AUTH_API.put(`/company/flyers/${id}/update/`, data);

export const deleteFlyer = (id) =>
    AUTH_API.delete(`/company/flyers/${id}/delete/`);

export const toggleFlyer = (id) =>
    AUTH_API.patch(`/company/flyers/${id}/toggle/`);

export const createFlyer = (formData) =>
  AUTH_API.post("/company/flyers/create/", formData);

export const getFlyerReviews = () =>
  AUTH_API.get("/company/flyers/reviews/");




export const createProduct = (data) =>
  AUTH_API.post("/company/products/create/", data);

export const updateProduct = (id, data) =>
  AUTH_API.put(`/company/products/${id}/update/`, data);

export const deleteProduct = (id) =>
  AUTH_API.delete(`/company/products/${id}/delete/`);

export const toggleProduct = (id) =>
  AUTH_API.patch(`/company/products/${id}/toggle/`);



export default BASE_API;   
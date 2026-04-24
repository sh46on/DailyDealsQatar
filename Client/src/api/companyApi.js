import {AUTH_API} from "./api";

export const fetchCompanies = () => AUTH_API.get("/admin/companies/");
export const createCompany = (data) => AUTH_API.post("/admin/companies/", data);
export const updateCompany = (id, data) => AUTH_API.put(`/admin/companies/${id}/`, data);
export const deleteCompany = (id) => AUTH_API.delete(`/admin/companies/${id}/`);
export const toggleCompany = (id) => AUTH_API.patch(`/admin/companies/${id}/toggle/`);





export const submitCompanyRequest = (data) =>
  AUTH_API.post(`/company-request/`, data);

export const getCompanyRequests = () =>
  AUTH_API.get(`/admin/company-requests/`);

export const approveCompany = (id, password) =>
  AUTH_API.post(`/admin/company-approve/${id}/`, { password });

export const rejectCompany = (id) =>
  AUTH_API.post(`/admin/company-reject/${id}/`);
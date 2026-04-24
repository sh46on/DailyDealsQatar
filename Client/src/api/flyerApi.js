import AUTH_API from "./authApi";

export const getFlyers = () => AUTH_API.get("/admin/flyers/");
export const toggleFlyer = (id) =>
  AUTH_API.patch(`/admin/flyers/${id}/toggle/`);
export const deleteFlyer = (id) =>
  AUTH_API.delete(`/admin/flyers/${id}/delete/`);




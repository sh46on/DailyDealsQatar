import {AUTH_API, BASE_URL} from "../../api/api";



// API calls
export const getUserNavbar = () =>
  AUTH_API.get("/user/navbar/");

export const getUserDashboard = () =>
  AUTH_API.get("/user/dashboard/");

export const toggleSave = (data) =>
  AUTH_API.post("/user/save-toggle/", data);



export const fetchSavedItems = () => 
  AUTH_API.get("/user/saved-items/");


// GET profile
export const getProfile = () => 
  AUTH_API.get("/user/profile/");

// UPDATE profile
export const updateProfile = (formData) =>
  AUTH_API.put("/user/profile/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });


export { BASE_URL };
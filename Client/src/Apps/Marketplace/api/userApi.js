import {AUTH_API, API_URL} from "../../../api/api";

export const BASE_URL = API_URL;


export const getUserNavbar = () =>
  AUTH_API.get("/user/navbar/");



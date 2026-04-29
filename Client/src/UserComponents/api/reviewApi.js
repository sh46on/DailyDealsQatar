import axios from "axios";
import { BASE_URL } from "./userApi";

const API = `${BASE_URL}/api/flyers`;

export const getFlyerReviews = (flyerId) =>
  axios.get(`${API}/${flyerId}/reviews/`);

export const postFlyerReview = (flyerId, data) =>
  axios.post(`${API}/${flyerId}/reviews/create/`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });
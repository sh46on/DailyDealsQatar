import axios from "axios";
import {  MARKET_API } from "../../../api/api";



export const fetchAnalytics = () => {
  return MARKET_API.get("/admin/analytics/");
};

export const fetchUserActivity = () => {
  return MARKET_API.get("/admin/user-activity/");
};



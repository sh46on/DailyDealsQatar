import axios from "axios";
import {  MARKET_API } from "../../../api/api";



// Get users (paginated)
export const fetchAdminUsers = (page = 1) =>
  MARKET_API.get(`/admin/users/?page=${page}`);

// Delete user
export const deleteUser = (id) =>
  MARKET_API.delete(`/admin/users/${id}/delete/`);
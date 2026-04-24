import axios from "axios";
import {  MARKET_API } from "../../../api/api";


// Fetch listings
export const fetchAdminListings = () => MARKET_API.get("/admin/listings/");

// Toggle active
export const toggleListingStatus = (id) =>
  MARKET_API.patch(`/admin/listings/${id}/toggle/`);

// Delete
export const deleteListing = (id) =>
  MARKET_API.delete(`/admin/listings/${id}/delete/`);
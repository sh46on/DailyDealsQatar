import axios from "axios";
import { getImageUrl } from "../api/media";
import {API} from "./api"


export const fetchHomeData = async ({
  page = 1,
  url = null,
  signal,
  ...filters
} = {}) => {

  let response;

  if (url) {
    // NEXT / PREVIOUS pagination
    response = await axios.get(url, { signal });
  } else {
    response = await API.get("/home/", {
      params: {
        page,
        ...filters,
      },
      signal,
    });
  }

  const data = response.data;

  return {
    count: data.count,
    next: data.next,
    previous: data.previous,

    // COMPANIES
    companies: data.companies?.map(c => ({
      ...c,
      logo: getImageUrl(c.logo),
    })) || [],

    // CATEGORIES
    categories: data.categories?.map(cat => ({
      ...cat,
      image: getImageUrl(cat.image),
    })) || [],

    // CATEGORY TYPES
    pdfCategoryTypes: data.pdf_category_types || [],

    // PRODUCTS (DRF PAGINATION)
    products: (data.results || []).map(p => ({
      ...p,
      image: getImageUrl(p.image),
    })),

    // PDFS (NOT PAGINATED)
    pdfs: (data.pdfs || []).map(pdf => ({
      ...pdf,
      pdf: getImageUrl(pdf.pdf),
      company_logo: getImageUrl(pdf.company_logo),
    })),
  };
};
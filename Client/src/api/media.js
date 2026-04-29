import {BASE_URL} from "./api"


export const getImageUrl = (url) => {
  if (!url) return null;

  // already full URL
  if (url.startsWith("http")) return url;

  // fix accidental double media
  url = url.replace(/^\/media\/media\//, "/media/");

    // ensure leading slash
  if (!url.startsWith("/")) url = `/${url}`;
 
  // add /media/ prefix if not already there
  if (!url.startsWith("/media/")) url = `/media${url}`;

  return `${BASE_URL}${url}`;
};
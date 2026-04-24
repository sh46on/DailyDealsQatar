import BASE_URL from "./api"


export const getImageUrl = (url) => {
  if (!url) return null;

  // already full URL
  if (url.startsWith("http")) return url;

  // fix accidental double media
  url = url.replace(/^\/media\/media\//, "/media/");

  return `${BASE_URL}${url}`;
};
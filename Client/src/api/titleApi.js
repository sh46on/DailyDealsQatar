import {API} from "./api"


  export const getPublicSettings = () =>
    API.get("/settings/public/");

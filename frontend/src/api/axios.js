// axios instance 
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:10000/api",
});

export default API;

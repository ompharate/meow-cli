import axios from "axios";

export const getRequest = async (url) => {
  try {
    const response = await axios.get(url);
    console.log("GET Response:", response.data);
  } catch (error) {
    console.error("Error making GET request:", error.message);
  }
};

export const postRequest = async (url, data) => {
  try {
    const response = await axios.post(url, data);
    console.log("POST Response:", response.data);
  } catch (error) {
    console.error("Error making POST request:", error.message);
  }
};

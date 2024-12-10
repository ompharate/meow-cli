import axios from "axios";

export const getMeowPackage = async (repoName, passKey) => {
  const response = await axios.post("https://meowhub.ompharate.tech/api/cli/v1/pull", {
    passKey,
    repoName,
  });

  return response.data.downloadUrl;
};

export const postRequest = async (url, data) => {
  try {
    const response = await axios.post(url, data);
    console.log("POST Response:", response.data);
  } catch (error) {
    console.error("Error making POST request:", error.message);
  }
};

export async function sendAuditRecord(repoName, passkey,visibility) {
  
  try {
    const response = await fetch(
      "https://meowhub.ompharate.tech/api/cli/v1/audit/record",
      {
        method: "POST",
        body: JSON.stringify({
          repoName,
          passKey: passkey,
          visibility
        }),
      }
    );
    const result = await response.json();

    if (!result.success) {
      console.log("Error:", result.message || "Unexpected error");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending audit record:", error.message);
    return false;
  }
}

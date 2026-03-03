
const HPD_API_KEY_URL =
  "https://mspwvw-hpdleov3.nyc.gov/authenticationservice/1.0/api/Apim/token";
const HPD_COMPLAINTS_URL =
  "https://mspwvw-hpdleov3.nyc.gov/hpdonline.api/1.0/api/building/complaint/list";

const getApiKey = async () => {
  const response = await fetch(HPD_API_KEY_URL, { method: "POST" });
  const data = await response.json();
  return data.token;
};
const getHpdComplaints = async (buildingId, token) => {
  const body = {
    buildingId: buildingId,
    isCountRequired: true,
    paging: { pageNumber: 1, pageSize: 1000 },
    sort: { sortKey: "receivedDate", sortOrder: "desc" },
  };
  const response = await fetch(HPD_COMPLAINTS_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ApiKey: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data.responseData.items;
};

const getComplaint = (complaints, srNumber) => {
  return complaints.find((c) => c.serialNo === srNumber);
};

const getDeeplTargetLanguage = (language) => {
  if (language.length === 2) return language;
  if (language === "hat") return "ht"; // Haitian Creole
  if (language === "spa") return "ES-419"; // Spanish (Latin American);
  if (language === "eng") return "en";
  return undefined;
};

const getUsersByBuilding = async (ddbDocClient) => {
  const params = {
    TableName: process.env.DB_TABLE,
    IndexName: process.env.DB_GSI_BUILDING_ID,
    KeyConditionExpression: `hpdBuildingId = :gsi_val`,
    ExpressionAttributeValues: {
      ":gsi_val": phone,
    },
  };
  try {
    const data = await ddbDocClient.send(new QueryCommand(params));
    console.log("User by phone:", JSON.stringify(data, null, 2));
    if (!data.Items || data.Items.length === 0) {
      console.log("No items found with the GSI key.");
      throw error;
    }
    return data.Items[0];
  } catch (err) {
    console.error("Unable to query GSI. Error:", err);
  }   
}
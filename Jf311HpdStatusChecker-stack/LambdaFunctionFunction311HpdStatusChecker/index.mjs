import * as deepl from "deepl-node";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const config = { region: process.env.AWS_REGION_NAME };
const smClient = new SecretsManagerClient(config);

// Fetch the secret once during the Lambda function's init phase (cold start)
let secretsData;

const getSecrets = async (secretId) => {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await smClient.send(command);
    const data = JSON.parse(response.SecretString);
    secretsData = { ...secretsData, ...data };
    console.log("Secret fetched during init phase");
  } catch (error) {
    console.error("Error fetching secret during init:", error);
    throw error; // Terminate function if secret cannot be retrieved
  }
};

await getSecrets(process.env.DEEPL_SECRET_NAME);

const deeplClient = new deepl.DeepLClient(secretsData.deeplToken);

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

const get2CharLanguageCode = (language) => {
  if (language.length === 2) return language;
  if (language === "hat") return "ht"; // Haitian Creole
  if (language === "spa") return "ES-419"; // Spanish (Latin American);
  if (language === "eng") return "en";
  return undefined;
};

export const handler = async (event) => {
  console.log("EVENT: ", JSON.stringify(event, null, 2));

  try {
    const buildingId = event.queryStringParameters.buildingId;
    const srNumber = event.queryStringParameters.srNumber;
    const language = get2CharLanguageCode(event.queryStringParameters.language);

    if (!language) {
      return {
        statusCode: 400,
        body: "Language parameter must be 2-character code accepted by DeepL",
      };
    }

    if (!buildingId || !srNumber) {
      return {
        statusCode: 400,
        body: "Missing buildingId or srNumber query parameter",
      };
    }

    const apiToken = await getApiKey();
    const allComplaints = await getHpdComplaints(buildingId, apiToken);
    const complaint = getComplaint(allComplaints, srNumber);

    if (language === "en") {
      complaint["statusDescriptionTranslated"] = complaint.statusDescription;
    } else {
      const translation = await deeplClient.translateText(
        complaint.statusDescription,
        null,
        language,
      );
      complaint["statusDescriptionTranslated"] = translation.text;
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify(complaint),
    };
    return response;
  } catch (error) {
    console.error("Error fetching secret during init:", error);
    throw error; // Terminate function if secret cannot be retrieved
  }
};

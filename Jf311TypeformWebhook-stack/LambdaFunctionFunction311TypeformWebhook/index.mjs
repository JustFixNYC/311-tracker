import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import crypto from "crypto";
import TextitClient from "./textit-client.mjs";
import { handleTypeformResponse } from "./typeform.mjs";

const smClient = new SecretsManagerClient({
  region: process.env.AWS_REGION_NAME,
});

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

await getSecrets(process.env.TYPEFORM_SECRET_NAME);
await getSecrets(process.env.TEXTIT_SECRET_NAME);

// Saves some resources to define here outside functions
const textitClient = new TextitClient(secretsData.textitToken);

export const handler = async (event, context) => {
  console.log("Event: ", JSON.stringify(event, null, 2));

  // Verify the webhook signature
  if (!verifySignature(event, secretsData.webhookSecret)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid signature" }),
    };
  }

  try {
    await handleTypeformResponse(event, textitClient);

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Handle JSON parsing errors
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON payload" }),
      };
    }

    // Handle all other errors
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// Verify the webhook secret
const verifySignature = (event, webhookSecret) => {
  try {
    // Get the sginature from headers
    const signature = event.headers["typeform-signature"];

    if (!signature) {
      console.log("No signature found in headers:", event.headers);
      return false;
    }

    // Get the raw body (return an empty string if the body key doesn't exist)
    const body = event.body.toString() || "";

    // Create HMAC using the secret key
    const hmac = crypto.createHmac("sha256", webhookSecret);
    // Typeform uses base64 instead of "hex" as in aws example
    const hash = hmac.update(body).digest("base64");
    const expectedSignature = `sha256=${hash}`;

    // Compare expected and received signatures
    const isValid = signature === expectedSignature;
    if (!isValid) {
      console.log(
        `Invalid signature. Received: ${signature}, Expected: ${expectedSignature}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error during signature verification:", error);
    return false;
  }
};

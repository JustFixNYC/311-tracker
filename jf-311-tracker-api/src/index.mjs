import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const config = { region: process.env.AWS_REGION_NAME };

const ddbClient = new DynamoDBClient(config);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const getUserComplaints = async (event) => {
  const params = {
    TableName: process.env.DB_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };
  try {
    const command = new GetCommand(params);
    const data = await ddbDocClient.send(command);

    if (data.Item) {
      console.log(
        "Success, item retrieved:",
        JSON.stringify(data.Item, null, 2),
      );

      return {
        statusCode: 200,
        body: "success",
      };
    } else {
      console.log("Item not found");
      return {
        statusCode: 404,
        body: "Item not found",
      };
    }
  } catch (err) {
    console.error("Error retrieving item:", err);
    throw error;
  }
};

const getUserByPhone = async (phone) => {
  const params = {
    TableName: process.env.DB_TABLE,
    IndexName: process.env.DB_GSI_PHONE_NAME,
    KeyConditionExpression: `phone = :gsi_val`,
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
};

const addSrNumbersForUser = async (event) => {
  const { phone, srNumbers } = JSON.parse(event.body);
  const userData = await getUserByPhone(phone);
  const allSrNumbers = [...srNumbers, ...userData.srNumbers];
  const uniqueSrNubers = [...new Set(allSrNumbers)];

  const params = {
    TableName: process.env.DB_TABLE,
    Key: {
      id: userData.id,
    },
    UpdateExpression: "set srNumbers = :sr",
    ExpressionAttributeValues: {
      ":sr": uniqueSrNubers,
    },
    ReturnValues: "UPDATED_NEW",
  };

  let response;
  try {
    const resp = await ddbDocClient.send(new UpdateCommand(params));
    console.log("UpdateItem succeeded:", resp);
    response = {
      statusCode: 200,
      body: "311 Service Request Numbers added to user",
    };
  } catch (err) {
    console.error("Unable to update item. Error:", err);
    response = {
      statusCode: 404,
      body: "Item not found",
    };
  }
  return response;
};

export const handler = async (event) => {
  console.log("EVENT: ", JSON.stringify(event, null, 2));

  const { httpMethod, resource } = event;

  try {
    let response;

    if (httpMethod === "POST" && resource === "/srNumbers") {
      response = await addSrNumbersForUser(event);
    } else if (httpMethod === "GET" && resource === "/complaints/{id}") {
      response = await getUserComplaints(event);
    } else {
      response = {
        statusCode: 404,
        body: "Resource does not exist",
      };
    }

    return response;
  } catch (error) {
    console.error("ERROR: ", error);
    throw error; // Terminate function if secret cannot be retrieved
  }
};

import crypto from "node:crypto";
import { PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  findAnswerByRefRegex,
  filterAnswersByRefRegex,
  toTextitLanguageCode,
  format311SrNumber,
} from "./typeform.mjs";
import { getIssuesNotes, uploadChecklist } from "./checklist.mjs";

const ADDRESS_BUILDING_ID_MAP = {
  "237 West 18 Street, Manhattan": "30714",
  "544 West 50 Street, Manhattan": "33842",
  "546 West 50 Street, Manhattan": "33843",
  "548 West 50 Street, Manhattan": "33844",
  "349 East 51 Street, Manhattan": "14114",
  "233 East 77 Street, Manhattan": "16383",
  "2 West 120 Street, Manhattan": "38850",
  "402 West 148 Street, Manhattan": "42242",
  "412 West 148 Street, Manhattan": "42248",
  "509 West 155 Street, Manhattan": "42695",
  "155 Audubon Avenue, Manhattan": "6183",
  "281 Wadsworth Avenue, Manhattan": "29018",
  "4530 Broadway, Manhattan": "8302",
  "11 Hillside Avenue, Manhattan": "22833",
  "25 Hillside Avenue, Manhattan": "22840",
  "241 Sherman Avenue, Manhattan": "27603",
  "536 Isham Street, Manhattan": "23134",
  "639 West 207 Street, Manhattan": "43709",
  "34 Seaman Avenue, Manhattan": "27549",
  "58 Elizabeth Street, Manhattan": "21498",
  "58 Elizabeth Street, Manhattan": "21498",
  "681 West 193 Street, Manhattan": "43647",
  "2340 Valentine Avenue, Bronx": "117066",
  "2800 Heath Avenue, Bronx": "84210",
  "4360 Baychester Avenue, Bronx": "48724",
  "3410 Kingsbridge Avenue, Bronx": "89745",
  "244 Fieldston Terrace, Bronx": "78215",
  "307 12 Street, Brooklyn": "137961",
  "292 St Johns Place, Brooklyn": "373952",
  "916 Carroll Street, Brooklyn": "218214",
  "926 Carroll Street, Brooklyn": "218216",
  "915 Washington Avenue, Brooklyn": "388949",
  "1296 Pacific Street, Brooklyn": "349507",
  "497 Eastern Parkway, Brooklyn": "287852",
  "489 Eastern Parkway, Brooklyn": "287851",
  "481 Eastern Parkway, Brooklyn": "287849",
  "1038 Union Street, Brooklyn": "383021",
  "1042 Union Street, Brooklyn": "383024",
  "1048 Union Street, Brooklyn": "383025",
  "1060 Union Street, Brooklyn": "383028",
  "1171 President Street, Brooklyn": "355160",
  "991 Carroll Street, Brooklyn": "218226",
  "1023 Carroll Street, Brooklyn": "217282",
  "1601 Bedford Avenue, Brooklyn": "205746",
  "1597 Bedford Avenue, Brooklyn": "205742",
  "1617 President Street, Brooklyn": "355454",
  "988 Montgomery Street, Brooklyn": "340087",
  "706 Lefferts Avenue, Brooklyn": "323643",
  "314 Clinton Avenue, Brooklyn": "222826",
  "854 East New York Avenue, Brooklyn": "287456",
  "3301 Farragut Road, Brooklyn": "291198",
  "225 Parkside Avenue, Brooklyn": "352206",
  "85 Clarkson Avenue, Brooklyn": "221457",
  "176 Clarkson Avenue, Brooklyn": "221353",
  "28 Argyle Road, Brooklyn": "243811",
  "40 Argyle Road, Brooklyn": "243836",
  "470 Ocean Avenue, Brooklyn": "347738",
  "115 East 21 Street, Brooklyn": "248835",
  "222 Lenox Road, Brooklyn": "324112",
  "240 East 18 Street, Brooklyn": "247712",
  "681 Ocean Avenue, Brooklyn": "347772",
  "2102 Beverly Road, Brooklyn": "209767",
  "416 East 17 Street, Brooklyn": "247123",
  "422 East 17 Street, Brooklyn": "247124",
  "405 East 16 Street, Brooklyn": "246461",
  "1820 Cortelyou Road, Brooklyn": "226482",
  "330 East 19 Street, Brooklyn": "248636",
  "426 East 22 Street, Brooklyn": "250398",
  "529 East 22 Street, Brooklyn": "250415",
  "2513 Newkirk Avenue, Brooklyn": "344339",
  "615 Rugby Road, Brooklyn": "244774",
  "607 Rugby Road, Brooklyn": "244772",
  "1280 Ocean Avenue, Brooklyn": "347199",
  "1362 Ocean Avenue, Brooklyn": "347209",
  "1554 Ocean Avenue, Brooklyn": "347244",
  "815 Gravesend Neck Road, Brooklyn": "303589",
  "1535 Ocean Avenue, Brooklyn": "347242",
  "2400 Nostrand Avenue, Brooklyn": "346496",
  "619 Rugby Road, Brooklyn": "244775",
  "619 Rugby Road, Brooklyn": "244775",
  "45-35 44 Street, Queens": "433052",
  "25-10 30 Road, Queens": "416621",
  "76-09 34 Avenue, Queens": "421463",
  "85-05 35 Avenue, Queens": "422499",
  "94-06 34 Avenue, Queens": "421507",
  "94-06 34 Road, Queens": "421607",
  "40-15 Hampton Street, Queens": "661473",
  "35-19 147 Street, Queens": "557654",
  "85-50 Forest Parkway, Queens": "655658",
  "86-20 Park Lane South, Queens": "686953",
  "87-50 Kingston Place, Queens": "671254",
  "63-70 Austin Street, Queens": "629716",
  "3657 Broadway, Manhattan": "8101",
  "3647 Broadway, Manhattan": "8097",
  "961 Washington Ave, Brooklyn": "388952",
  "671 West 193 Street, Manhattan": "43647",
  "251 Sherman Ave, Manhattan": "27603",
  "35 Hillside Ave, Manhattan": "22840",
  "993 Carroll Street, Brooklyn": "218226",
  "10 Columbia Place, Brooklyn": "1014563",
  "40 Columbia Place, Brooklyn": "224141",
  "2 Columbia Place, Brooklyn": "807986",
  "4 Columbia Place, Brooklyn": "807986",
  "6 Columbia Place, Brooklyn": "807986",
  "30 Joralemon Street, Brooklyn": "807986",
  "8 Columbia Place, Brooklyn": "807988",
  "28 Columbia Place, Brooklyn": "807987",
  "30 Columbia Place, Brooklyn": "1014557",
  "10 Columbia Place, Brooklyn": "1014563",
  "14 Columbia Place, Brooklyn": "1009160",
  "16 Columbia Place, Brooklyn": "807985",
  "20 Joralemon Street, Brooklyn": "808617",
  "22 Joralemon Street, Brooklyn": "808617",
  "24 Joralemon Street, Brooklyn": "808617",
  "26 Joralemon Street, Brooklyn": "808617",
  "28 Joralemon Street, Brooklyn": "808617",
  "32 Joralemon Street, Brooklyn": "",
  "441 Convent Avenue, Manhattan": "10007",
  "40-25 Hampton Street, Queens": "661475",
  "40-35 Hampton Street, Queens": "661479",
  "40-45 Hampton Street, Queens": "661482",
};

const getHpdBuildingId = (address) => {
  return ADDRESS_BUILDING_ID_MAP[address] || "";
};

const getUserByPhone = async (ddbDocClient, phone) => {
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
      return undefined;
    }
    return data.Items[0];
  } catch (err) {
    console.error("Unable to query GSI. Error:", err);
  }
};

const addOrUpdateUptTenantDb = async (ddbDocClient, data) => {
  const user = await getUserByPhone(ddbDocClient, data.phone);

  // If user exists update using their id, otherwise use newly generated id
  // if user exists add new SR numbers to existing list, otherwise use new set
  // all other fields get overwritten for now
  let userId, srNumbers;
  if (!!user?.id) {
    userId = user.id;
    const allSrNumbers = [...data.srNumbers, ...user.srNumbers];
    const uniqueSrNumbers = [...new Set(allSrNumbers)].filter((x) => !!x);
    srNumbers = uniqueSrNumbers;
  } else {
    userId = data.userId;
    srNumbers = data.srNumbers;
  }

  const params = {
    TableName: process.env.DB_TABLE,
    Key: {
      id: userId, // Primary Key of the item to update
    },
    // Defines how to modify attributes
    UpdateExpression:
      "set phone = :p, fullName = :fn, language3 = :l, org = :o, address = :addr, apartment = :apt, hpdBuildingId = :hpdid, checklistUrl = :checkurl, issuesNotes = :iss, srNumbers = :sr",
    ExpressionAttributeValues: {
      // Placeholder values for the update
      ":p": data.phone,
      ":fn": data.name,
      ":l": data.language3,
      ":o": "upt",
      ":addr": data.address,
      ":apt": data.apartment,
      ":hpdid": data.hpdBuildingId,
      ":checkurl": data.checklistUrl,
      ":iss": data.issuesNotes,
      ":sr": srNumbers,
    },
    ReturnValues: "UPDATED_NEW", // Returns the new values of the updated attributes
  };

  try {
    const resp = await ddbDocClient.send(new PutCommand(params));
    console.log("UpdateItem succeeded:", resp);
  } catch (err) {
    console.error("Unable to update item. Error:", err);
  }
};

const addUptTenantDb = async (ddbDocClient, data) => {
  // We are now allowing duplicates by phone number, since some tenants don't
  // want to provide their phone number and so others have been using their own
  // phone number and that's overwritten information.

  const params = {
    TableName: process.env.DB_TABLE,
    Item: {
      id: data.userId,
      // Placeholder values for the update
      phone: data.phone,
      fullName: data.name,
      language3: data.language3,
      org: "upt",
      address: data.address,
      apartment: data.apartment,
      hpdBuildingId: data.hpdBuildingId,
      checklistUrl: data.checklistUrl,
      issuesNotes: data.issuesNotes,
      pets: data.pets,
      srNumbers: data.srNumbers,
    },
  };

  try {
    const resp = await ddbDocClient.send(new PutCommand(params));
    console.log("Add DB Record succeeded:", resp);
  } catch (err) {
    console.error("Unable to add DB record. Error:", err);
  }
};

export const handleUptResponse = async (
  payload,
  textitClient,
  s3Client,
  ddbDocClient,
) => {
  console.log("Handling UPT response");

  const answers = payload.form_response.answers;
  const submittedAt = payload.form_response.submitted_at;
  const phone = findAnswerByRefRegex(answers, /^phone-.{2}$/)?.phone_number;
  const name = findAnswerByRefRegex(answers, /^name-.{2}$/)?.text;
  const address = findAnswerByRefRegex(answers, /^address-.{2}$/)?.choice
    ?.label;
  const apartment = findAnswerByRefRegex(answers, /^apartment-.{2}$/)?.text;
  const hpdBuildingId = getHpdBuildingId(address);
  const languageAnswer = findAnswerByRefRegex(answers, /^language$/)?.choice
    ?.label;
  const petsChoices =
    findAnswerByRefRegex(answers, /^pets-.{2}$/)?.choices?.labels || [];
  const petsOther = findAnswerByRefRegex(answers, /^pets-other-.{2}$/)?.text;
  let pets;
  if (!!petsChoices || !!petsOther) {
    pets = [...petsChoices, petsOther]
      .map((pet) => {
        if (!pet || ["Other", "Otro", "Lòt"].includes(pet)) return;
        if (["Perro(s)", "Dog(s)", "Chen"].includes(pet)) return "Dog(s)";
        if (["Gato(s)", "Chat", "Cat(s)"].includes(pet)) return "Cat(s)";
        return pet;
      })
      .filter(Boolean)
      .join(",");
  } else {
    pets = "";
  }
  const language3 = toTextitLanguageCode(languageAnswer);
  const srAnswers = filterAnswersByRefRegex(answers, /^sr-\d+-.{2}$/);
  const srNumbersAll = srAnswers.map((x) => format311SrNumber(x.text));
  const srNumbers = [...new Set(srNumbersAll)];
  const srNumbersCsv = srNumbers.join(",");

  // No longer unique by phone, since we don't want to overwrite if multiple
  // responses use the same phone (for tenants that don't want to share phone a
  // neighbor can give theirs)
  const userId = crypto
    .createHash("sha256")
    .update(phone + submittedAt)
    .digest("hex");

  const issuesNotes = getIssuesNotes(answers);
  const checklistTitle = "UPT 311 Checklist";
  const checklistSubtitle = `${address} - Apt ${apartment}`;
  const checklistUrl = await uploadChecklist(
    issuesNotes,
    s3Client,
    checklistTitle,
    checklistSubtitle,
    "upt",
    userId,
  );

  const dbAttributes = {
    phone: phone,
    userId: userId,
    language3: language3,
    org: "upt",
    name: name,
    address: address,
    apartment: apartment,
    hpdBuildingId: hpdBuildingId,
    checklistUrl: checklistUrl,
    issuesNotes: issuesNotes,
    pets: pets,
    srNumbers: srNumbers,
  };

  await addUptTenantDb(ddbDocClient, dbAttributes);

  const textitFields = {
    upt_311_start_date: submittedAt,
    checklist_311_url: checklistUrl,
    hpd_building_id: hpdBuildingId,
    sr_311_numbers: srNumbersCsv,
    user_id_311_tracker: userId,
  };

  await textitClient.addOrUpdateContact(phone, name, language3, textitFields);

  await textitClient.addContactToGroup(phone, process.env.UPT_TEXTIT_GROUP);
};

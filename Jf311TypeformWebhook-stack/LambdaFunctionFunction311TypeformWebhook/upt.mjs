import crypto from 'node:crypto';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
};

const getHpdBuildingId = (address) => {
  return ADDRESS_BUILDING_ID_MAP[address] || "";
};

const addOrUpdateUptTenantDb = async (ddbDocClient, data) => {
  const params = {
    TableName: process.env.DB_TABLE,
    Key: {
      id: data.userId, // Primary Key of the item to update
    },
    // Defines how to modify attributes
    UpdateExpression:
      "set phone = :p, fullName = :fn, language3 = :l, org = :o, address = :addr, apartment = :apt, hpdBuildingId = :hpdid, checklistUrl = :checkurl, issuesNotes = :iss",
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
    },
    ReturnValues: "UPDATED_NEW", // Returns the new values of the updated attributes
  };

  try {
    const resp = await ddbDocClient.send(new UpdateCommand(params));
    console.log("UpdateItem succeeded:", resp);
  } catch (err) {
    console.error("Unable to update item. Error:", err);
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
  const language3 = toTextitLanguageCode(languageAnswer);
  const srAnswers = filterAnswersByRefRegex(answers, /^sr-\d+-.{2}$/);
  const srNumbersAll = srAnswers.map((x) => format311SrNumber(x.text));
  const srNumbers = [...new Set(srNumbersAll)];
  const srNumbersCsv = srNumbers.join(",");
  const userId = crypto.createHash('sha256').update(phone).digest('hex');

  const issuesNotes = getIssuesNotes(answers);
  const checklistTitle = "UPT 311 Checklist";
  const checklistSubtitle = `${address} - Apt ${apartment}`;
  const checklistUrl = await uploadChecklist(
    issuesNotes,
    s3Client,
    checklistTitle,
    checklistSubtitle,
    "upt",
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
    srNumbers: srNumbers,
  };

  await addOrUpdateUptTenantDb(ddbDocClient, dbAttributes);

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

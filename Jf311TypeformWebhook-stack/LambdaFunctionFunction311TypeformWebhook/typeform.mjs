const SUPPORTED_LANGUAGES = {
  eng: ["english", "eng", "en"],
  spa: ["spanish", "español", "espanol", "española", "espanola", "spa", "es"],
  hat: ["creole", "kreyòl", "kreyol", "hat", "ht"],
};

const getAnswerByRef = (answers, ref) => {
  return answers.find((answer) => answer.field.ref === ref);
};

const getHiddenField = (payload, hiddenField) => {
  return payload.form_response?.hidden?.[hiddenField];
};

const toIsoLanguage = (language) => {
  // Takes language string in various formats
  // Returns 3-digit iso code used by text. (eng if no match)
  if (!language || typeof language !== "string") {
    return "eng";
  }

  const languageLower = language.toLowerCase();

  if (SUPPORTED_LANGUAGES.eng.includes(languageLower)) {
    return "eng";
  } else if (SUPPORTED_LANGUAGES.spa.includes(languageLower)) {
    return "spa";
  } else if (SUPPORTED_LANGUAGES.hat.includes(languageLower)) {
    return "hat";
  } else {
    return "eng";
  }
};

const handleUptResponse = async (payload, textitClient) => {
  console.log("Handling UPT response");

  const answers = payload.form_response.answers;
  const submittedAt = payload.form_response.submitted_at;
  const phone = getAnswerByRef(answers, "phone")?.phone_number;
  const name = getAnswerByRef(answers, "name")?.text;
  const langHidden = getHiddenField(payload, "lang");
  const langQuestion = getAnswerByRef(answers, "language")?.text;
  const langIso = toIsoLanguage(langQuestion || langHidden);
  const sr311 = getAnswerByRef(answers, "sr_311")?.text || "";

  const fields = {
    [process.env.UPT_TEXTIT_DATE_FIELD]: submittedAt,
    [process.env.UPT_TEXTIT_311_SR_FIELD]: sr311,
  };

  const resp1 = await textitClient.addOrUpdateContact(
    phone,
    name,
    langIso,
    fields,
  );
  console.log("Textit - addOrUpdateContact: ", resp1);

  const resp2 = await textitClient.addContactToGroup(
    phone,
    process.env.UPT_TEXTIT_GROUP,
  );
  console.log("Textit - addContactToGroup: ", resp2);
};

export const handleTypeformResponse = async (event, textitClient) => {
  // Implementation for handling Typeform response

  // Parse the webhook payload
  const payload = JSON.parse(event.body);

  if (payload.event_type !== "form_response") {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `invalid event_type. Received ${payload.event_type}, expected "form_response"`,
      }),
    };
  }

  const formId = payload.form_response.form_id;

  //  Handle forms for each camapign
  switch (formId) {
    case process.env.UPT_FORM_ID:
      await handleUptResponse(payload, textitClient);
      break;

    default:
      console.log(`Received unhandled form ID: ${formId}`);
  }
};

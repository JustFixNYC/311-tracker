const SUPPORTED_LANGUAGES = {
  eng: ["english", "eng", "en"],
  spa: ["spanish", "español", "espanol", "española", "espanola", "spa", "es"],
  hat: ["creole", "kreyòl", "kreyol", "hat", "ht"],
};

export const getAnswerByRef = (answers, ref) => {
  return answers.find((answer) => answer.field.ref === ref);
};

export const getHiddenField = (payload, hiddenField) => {
  return payload.form_response?.hidden?.[hiddenField];
};

export const toIsoLanguage = (language) => {
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

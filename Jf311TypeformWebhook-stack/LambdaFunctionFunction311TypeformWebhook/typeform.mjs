const SUPPORTED_LANGUAGES = {
  eng: ["english", "eng", "en"],
  spa: ["spanish", "español", "espanol", "española", "espanola", "spa", "es"],
  hat: ["creole", "kreyòl", "kreyol", "hat", "ht"],
};

// There are multiple possible refs (one for each language), but there can only
// ever be one of the answer versions present in a response
export const findAnswerByRefRegex = (answers, regex) => {
  return answers.find((answer) => answer.field.ref.match(regex));
};

export const filterAnswersByRefRegex = (answers, regex) => {
  return answers.filter((answer) => answer.field.ref.match(regex));
};

export const format311SrNumber = (x) => {
  if (x.match(/^311-\d{8}$/)) return x
  if (x.match(/^\d{8}$/)) return `311-${x}`
  return x
}

export const getHiddenField = (payload, hiddenField) => {
  return payload.form_response?.hidden?.[hiddenField];
};

export const toTextitLanguageCode = (language) => {
  // Takes language string in various formats
  // Returns 3-digit ISO 639-3 code used by text. (eng if no match)
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

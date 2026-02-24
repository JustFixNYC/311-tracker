class TextitClient {
  token;
  apiUrl = "https://textit.com/api/v2";

  constructor(textitToken) {
    this.token = textitToken;
  }

  phoneToUrn(phone) {
    if (!phone) {
      throw new Error("Phone number is required");
    }

    return `tel:+${String(phone).replace(/\D/g, "")}`;
  }

  async sendRequest(endpoint, method, body, urlParams = undefined) {
    const url = new URL(`${this.apiUrl}/${endpoint}.json`);
    if (urlParams) {
      Object.entries(urlParams).forEach(([key, value]) =>
        url.searchParams.append(key, value),
      );
    }
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${this.token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const { status, statusText } = response;
    return {
      status,
      statusText,
      data,
    };
  }

  /**
   * Add a new contact or update an existing one on Textit. Only the fields given will be changed. Cannot be used to change group membership.
   *
   * Note: while the endpoint allows for groups, ou need to sepecify a lsit of groups and it overwrites any existing groups. Instead use the addContactToGroup method after using this method to ensure the contact exists fist.
   *
   * @param {string} phone Phone number for the contact, will be reformated for 'tel:+12125551234' format.
   * @param {string} [name] The full name of the contact.
   * @param {string} [language] The preferred language for the contact (3 letter iso code e.g. eng, spa, hat, etc., defaults to english).
   * @param {object} [fields]  The contact fields you want to set or update on this contact (dictionary of up to 100 items).
   * @returns
   */
  async addOrUpdateContact(
    phone,
    name = "",
    language = "eng",
    fields = undefined,
  ) {
    const urn = this.phoneToUrn(phone);

    if (language.length != 3) {
      throw new Error("Language must be a 3 letter iso code");
    }

    const body = {
      name: name,
      language: language,
    };

    if (fields) body.fields = fields;

    const urlParams = { urn };

    return await this.sendRequest("contacts", "POST", body, urlParams);
  }

  /**
   * Add an existing contact to a Textit group.
   *
   * NOTE: the contact must already exist in Textit, so use the method addOrUpdateContact first.
   *
   * @param {string} phone phone number for the contact, will be reformatted to "tel:+12125551234"
   * @param {string} group UUID for the group to which to contact should be added
   * @returns
   */
  async addContactToGroup(phone, group) {
    const urn = this.phoneToUrn(phone);

    return await this.sendRequest("contact_actions", "POST", {
      contacts: [urn],
      action: "add",
      group: group,
    });
  }
}
export default TextitClient;

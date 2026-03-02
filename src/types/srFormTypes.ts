import { I18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import z from "zod";

import { looseOptional } from "../utils/form-utils";

export const srNumbersSchema = (i18n: I18n) =>
  z.object({
    phone_number: z
      .string({
        error: (iss) =>
          iss.input === undefined || iss.input === ""
            ? i18n._(msg`Phone number is required for follow up`)
            : i18n._(msg`Please enter a complete US phone number`),
      })
      // 10 digits, not starting with 0 or 1 (invalid first digits of area code,
      // part of validation on tenants2)
      .regex(
        /^[2-9]\d{9}$/,
        i18n._(msg`Please enter a complete US phone number`)
      ),
    // Flat arrays don't work with react-hook-form field array
    sr_numbers: looseOptional(
      z.array(
        z.object({
          sr_number: looseOptional(z.string()),
        })
      )
    ),
  });

export type SrNumbersFields = z.infer<ReturnType<typeof srNumbersSchema>>;

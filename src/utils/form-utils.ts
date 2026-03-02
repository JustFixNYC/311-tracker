import z from "zod";
import { SrNumbersFields } from "../types/srFormTypes";

// Helps handle the default empty string value that inputs take on
// https://timjames.dev/blog/building-forms-with-zod-and-react-hook-form-2geg
export const looseOptional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value: unknown) =>
      value === null || (typeof value === "string" && value === "")
        ? undefined
        : value,
    schema.optional()
  );

export const flattenSrNumbers = (
  srNumbers: SrNumbersFields["sr_numbers"]
): string[] | undefined =>
  srNumbers
    ?.map(({ sr_number }) => sr_number)
    .filter((srNumber): srNumber is string => !!srNumber);

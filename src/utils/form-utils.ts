import z from "zod";
import { SrNumbersFields } from "../types/srFormTypes";

// Formats raw digits as (555) 666-7777 for display
export const formatPhoneNumber = (value: string | undefined): string => {
  if (value === undefined) return "";

  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.slice(0, 10);
  const match = limited.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

  if (match) {
    const [, part1, part2, part3] = match;
    const formatted = [
      part1 ? `(${part1}` : "",
      part2 ? `) ${part2}` : "",
      part3 ? `-${part3}` : "",
    ]
      .join("")
      .trim();
    return formatted;
  }
  return value;
};

// Parses formatted phone to raw digits for storage/validation
export const parseFormattedPhoneNumber = (value: string): string =>
  value.replace(/\D/g, "").slice(0, 10);

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

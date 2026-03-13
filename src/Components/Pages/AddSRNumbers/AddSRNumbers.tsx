import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { Controller, useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import type { I18n } from "@lingui/core";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";
import {
  TextInput,
  Button,
  FormGroup,
  Icon,
} from "@justfixnyc/component-library";
import {
  formatPhoneNumber,
  parseFormattedPhoneNumber,
} from "../../../utils/form-utils";

// Format: 311-12345678 (311- followed by 8 digits)
const SR_NUMBER_REGEX = /^311-\d{8}$/;

const addFormSchema = (i18n: I18n) =>
  z.object({
    phone_number: z
      .string()
      .min(1, i18n._(msg`Phone number is required`))
      .regex(
        /^[2-9]\d{9}$/,
        i18n._(msg`Please enter a complete US phone number (10 digits)`)
      ),
    sr_numbers: z
      .array(
        z.object({
          value: z
            .string()
            .min(1, i18n._(msg`Service request number is required`))
            .regex(SR_NUMBER_REGEX, i18n._(msg`Format must be 311-12345678`)),
        })
      )
      .min(1, i18n._(msg`Add at least one service request number`)),
  });

type AddFormFields = z.infer<ReturnType<typeof addFormSchema>>;

const defaultValues: AddFormFields = {
  phone_number: "",
  sr_numbers: [{ value: "" }],
};

export const AddSRNumbers: React.FC = () => {
  const { i18n } = useLingui();
  const schema = addFormSchema(i18n);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddFormFields>({
    defaultValues,
    resolver: zodResolver(schema) as Resolver<AddFormFields>,
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sr_numbers",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const onSubmit = async (data: AddFormFields) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const body = {
        phone: "+1" + data.phone_number.replace(/\D/g, ""),
        srNumbers: data.sr_numbers.map((item) => item.value),
      };
      const apiUrl = import.meta.env.VITE_311_TRACKER_API_URL + "/srNumbers";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
      throw e;
    }
  };

  return (
    <div className="add-sr-numbers-page">
      <h1>
        <Trans>Add service requests</Trans>
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller
          name="phone_number"
          control={control}
          render={({ field }) => (
            <TextInput
              {...field}
              id="phone_number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              labelText={i18n._(msg`Phone number`)}
              placeholder="(123) 456-7890"
              value={formatPhoneNumber(field.value)}
              onChange={(e) =>
                field.onChange(parseFormattedPhoneNumber(e.target.value))
              }
              invalid={!!errors.phone_number}
              invalidText={errors.phone_number?.message}
              invalidRole="status"
            />
          )}
        />

        <FormGroup
          legendText={i18n._(
            msg`Service request numbers (format: 311-12345678)`
          )}
          invalid={!!errors.sr_numbers?.message}
          invalidText={errors.sr_numbers?.message}
          className="add-sr-numbers-page__sr-numbers"
        >
          {!!fields.length && (
            <div className="additional-sr-form-group">
              {fields.map((field, index) => (
                <section key={field.id} className="additional-sr-input">
                  <TextInput
                    {...register(`sr_numbers.${index}.value`)}
                    id={`form-sr_numbers-${index}`}
                    labelText=""
                    aria-label={`${i18n._(msg`Service request`)} #${index + 1}`}
                    placeholder="311-12345678"
                    invalid={!!errors.sr_numbers?.[index]?.value}
                    invalidText={errors.sr_numbers?.[index]?.value?.message}
                    invalidRole="status"
                    type="text"
                  />
                  {fields.length > 1 ? (
                    <Button
                      labelText={i18n._(msg`Remove`)}
                      labelIcon="xmark"
                      variant="tertiary"
                      size="small"
                      type="button"
                      onClick={() => remove(index)}
                    />
                  ) : null}
                </section>
              ))}
            </div>
          )}
          <button
            className="text-link-button jfcl-link"
            type="button"
            onClick={() => append({ value: "" })}
          >
            <Icon icon="plus" /> {i18n._(msg`Add another number`)}
          </button>
        </FormGroup>

        {submitSuccess && (
          <div className="success-message" role="status">
            <Icon icon="check" />
            <Trans>Your response has been submitted</Trans>
          </div>
        )}
        {submitError && (
          <div className="error-message" role="alert">
            <Icon icon="xmark" />
            <Trans>
              An error occurred. Please fill out the{" "}
              <a
                href="https://bit.ly/upt-311"
                target="_blank"
                rel="noopener noreferrer"
              >
                Typeform
              </a>{" "}
              before using this form.
            </Trans>
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          labelText={i18n._(msg`Submit`)}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </form>
    </div>
  );
};

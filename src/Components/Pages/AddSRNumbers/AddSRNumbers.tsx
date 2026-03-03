import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import type { I18n } from "@lingui/core";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";
import { TextInput, Button, FormGroup } from "@justfixnyc/component-library";

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
            .regex(
              SR_NUMBER_REGEX,
              i18n._(msg`Format must be 311-12345678`)
            ),
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

  const onSubmit = async (data: AddFormFields) => {
    setSubmitError(null);
    try {
      const body = {
        phone: "+1"+data.phone_number.replace(/\D/g, ""),
        srNumbers: data.sr_numbers.map((item) => item.value),
      };
      const apiUrl = import.meta.env.VITE_311_TRACKER_API_URL+"/srNumbers";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
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
        <TextInput
          id="phone_number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="2125551234"
          labelText={i18n._(msg`Phone number`)}
          invalid={!!errors.phone_number}
          invalidText={errors.phone_number?.message}
          {...register("phone_number")}
        />

        <FormGroup
          legendText={i18n._(
            msg`Service request numbers (format: 311-12345678)`
          )}
          invalid={!!errors.sr_numbers?.message}
          invalidText={errors.sr_numbers?.message}
          className="add-sr-numbers-page__sr-numbers"
        >
          {fields.map((field, index) => (
            <div key={field.id} className="add-sr-numbers-page__sr-row">
              <TextInput
                id={`sr_numbers.${index}`}
                type="text"
                placeholder="311-12345678"
                labelText={`${i18n._(msg`Service request`)} #${index + 1}`}
                invalid={!!errors.sr_numbers?.[index]?.value}
                invalidText={errors.sr_numbers?.[index]?.value?.message}
                {...register(`sr_numbers.${index}.value`)}
              />
              {fields.length > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  labelText={i18n._(msg`Remove`)}
                  onClick={() => remove(index)}
                  className="add-sr-numbers-page__remove"
                />
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            labelText={i18n._(msg`Add another`)}
            onClick={() => append({ value: "" })}
            className="add-sr-numbers-page__add-another"
          />
        </FormGroup>

        {submitError && (
          <p className="add-sr-numbers-page__error" role="alert">
            {submitError}
          </p>
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

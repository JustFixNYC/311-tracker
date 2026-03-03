import { Trans } from "@lingui/react/macro";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SrNumbersFields, srNumbersSchema } from "../../types/srFormTypes";
import { useLingui } from "@lingui/react";

export const SrForm: React.FC = () => {
  const { i18n } = useLingui();
  useForm<SrNumbersFields>({
    // Issue with the inferred type being "unknown" when preprocess() is used to
    // handle values that should be changed to undefined
    resolver: zodResolver(srNumbersSchema(i18n)) as Resolver<SrNumbersFields>,
    mode: "onSubmit",
  });

  return (
    <div className="sr-form">
      <h1>
        <Trans>311 Tracker</Trans>
      </h1>
      <h2>311 Service Request Numbers</h2>
    </div>
  );
};

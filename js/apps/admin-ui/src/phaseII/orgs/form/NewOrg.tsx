import { useTranslation } from "react-i18next";
import { Controller, useFormContext } from "react-hook-form";
import { FormGroup, TextInput, ValidatedOptions } from "@patternfly/react-core";
import { MultiLineInput } from "../../../components/multi-line-input/MultiLineInput";
import { HelpItem } from "ui-shared";

export const NewOrg = () => {
  const { t } = useTranslation("orgs");
  const {
    formState: { errors },
    control,
  } = useFormContext();

  return (
    <>
      {/*Name*/}
      <FormGroup
        name="create-modal-org"
        label={t("common:name")}
        fieldId="name"
        helperTextInvalid={t("common:required")}
        validated={
          errors.name ? ValidatedOptions.error : ValidatedOptions.default
        }
        isRequired
      >
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextInput
              id="name"
              value={field.value}
              onChange={field.onChange}
              data-testid="name-input"
              validated={
                errors.name ? ValidatedOptions.error : ValidatedOptions.default
              }
            />
          )}
        />
      </FormGroup>

      {/*Display name*/}
      <FormGroup
        name="create-modal-org"
        label={t("displayName")}
        fieldId="displayName"
      >
        <Controller
          name="displayName"
          control={control}
          render={({ field }) => (
            <TextInput
              id="displayName"
              value={field.value}
              onChange={field.onChange}
              data-testid="displayName-input"
            />
          )}
        />
      </FormGroup>

      {/*Domains*/}
      <FormGroup
        label={t("domains")}
        fieldId="domains"
        labelIcon={
          <HelpItem
            helpText={t("orgs:domainHelp")}
            fieldLabelId={t("orgs:domain")}
          />
        }
      >
        <MultiLineInput
          name="domains"
          aria-label={t("domains")}
          addButtonLabel="orgs:addDomain"
        />
      </FormGroup>

      {/*Url*/}
      <FormGroup name="create-modal-org" label={t("url")} fieldId="url">
        <Controller
          name="url"
          control={control}
          render={({ field }) => (
            <TextInput
              id="url"
              value={field.value}
              onChange={field.onChange}
              data-testid="url-input"
            />
          )}
        />
      </FormGroup>
    </>
  );
};

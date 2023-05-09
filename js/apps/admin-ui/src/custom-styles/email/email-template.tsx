import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  PageSection,
  Select,
  SelectOption,
  SelectVariant,
  Spinner,
  ValidatedOptions,
} from "@patternfly/react-core";
import { BaseSyntheticEvent, ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAlerts } from "../../components/alert/Alerts";
import { HelpItem } from "ui-shared";
import { KeycloakTextArea } from "../../components/keycloak-text-area/KeycloakTextArea";
import { useAdminClient } from "../../context/auth/AdminClient";
import { useRealm } from "../../context/realm-context/RealmContext";
import { SaveReset } from "../components/SaveReset";
import useStylesFetcher from "../useStylesFetcher";

type EmailTemplateTabProps = {
  realm: RealmRepresentation;
  refresh: () => void;
};

type EmailTemplateFormType = {
  htmlEmail: string;
  textEmail: string;
};

const PlaceholderSelectOption = () => (
  <SelectOption key="plcSlcOption" value="Clear selection" isPlaceholder />
);

interface EmailTemplateMap {
  [key: string]: string;
}

export const EmailTemplate = ({ realm, refresh }: EmailTemplateTabProps) => {
  const { adminClient } = useAdminClient();
  const { realm: realmName } = useRealm();
  const { t } = useTranslation("styles");
  const { addAlert, addError } = useAlerts();
  const { getEmailTemplates, getEmailTemplateValue, updateEmailTemplateValue } =
    useStylesFetcher();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingEmailTheme, setUpdatingEmailTheme] = useState(false);

  const {
    register,
    // control,
    reset: resetForm,
    getValues,
    setError,
    // clearErrors,
    setValue,
    formState: { errors },
  } = useForm<EmailTemplateFormType>({
    defaultValues: {
      htmlEmail: "",
      textEmail: "",
    },
  });

  const hasEmailThemeSettingsEnabled = realm.emailTheme === "attributes";

  async function getEmailTemplatesInfo() {
    const emailTemplates = await getEmailTemplates();
    if (!emailTemplates.error) {
      setTemplateSelectDisabled(!hasEmailThemeSettingsEnabled);
      setEmailTemplates(emailTemplates);
    }
  }

  useEffect(() => {
    getEmailTemplatesInfo();
  }, []);

  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [templateSelectDisabled, setTemplateSelectDisabled] = useState(
    !hasEmailThemeSettingsEnabled
  );

  const getEmailTemplateValues = async () => {
    if (selectedTemplateId) {
      setValue("htmlEmail", "");
      setValue("textEmail", "");
      setIsLoading(true);
      setTemplateSelectDisabled(true);

      // Call to get email templates
      const htmlT = await getEmailTemplateValue({
        templateType: "html",
        templateName: selectedTemplateId,
      });
      const textT = await getEmailTemplateValue({
        templateType: "text",
        templateName: selectedTemplateId,
      });

      if (htmlT.error) {
        addError(htmlT.message, "error");
      } else {
        setValue("htmlEmail", htmlT.message);
      }
      if (textT.error) {
        addError(textT.message, "error");
      } else {
        setValue("textEmail", textT.message);
      }
    } else {
      setValue("htmlEmail", "");
      setValue("textEmail", "");
    }
    setTemplateSelectDisabled(false);
    setIsLoading(false);
  };

  useEffect(() => {
    getEmailTemplateValues();
  }, [selectedTemplateId]);

  const emailTemplateSelectOptions = Object.keys(emailTemplates).map((k) => (
    <SelectOption
      value={`${emailTemplates[k]} (${k})`}
      key={k}
      id={k}
      itemID={k}
    />
  ));
  const templateSelectOptions = [
    <PlaceholderSelectOption key="plcSlcOption" />,
    ...emailTemplateSelectOptions,
  ];

  const clearSelection = () => {
    setSelectedTemplate(undefined);
    setSelectedTemplateId(undefined);
    setIsTemplateSelectOpen(false);
  };

  const selectTemplate = (
    event: MouseEvent | ChangeEvent | BaseSyntheticEvent,
    value: string,
    isPlaceholder?: boolean | undefined
  ) => {
    if (isPlaceholder) clearSelection();
    else {
      setSelectedTemplate(value);
      setSelectedTemplateId(event.target?.getAttribute("itemid"));
      setIsTemplateSelectOpen(false);
    }
  };

  const save = async () => {
    const { htmlEmail, textEmail } = getValues();

    try {
      setIsSaving(true);
      setTemplateSelectDisabled(true);
      const htmlResp = await updateEmailTemplateValue({
        templateType: "html",
        templateName: selectedTemplateId!,
        templateBody: htmlEmail,
      });
      const textResp = await updateEmailTemplateValue({
        templateType: "text",
        templateName: selectedTemplateId!,
        templateBody: textEmail,
      });

      if (htmlResp.error || textResp.error) {
        if (htmlResp.error) {
          setError("htmlEmail", { type: "custom", message: htmlResp.message });
        }
        if (textResp.error) {
          setError("textEmail", { type: "custom", message: textResp.message });
        }
        throw new Error(htmlResp.error ? htmlResp.message : textResp.message);
      }
      addAlert(`Templates for the ${selectedTemplate} have been updated.`);
    } catch (e) {
      console.error("Could not update the email templates.", e);
      addError("Failed to update the email templates.", e);
    }
    setIsSaving(false);
    setTemplateSelectDisabled(false);
  };

  const reset = async () => {
    clearSelection();
    resetForm();
  };

  const updateRealmTheme = async (value: string = "attributes") => {
    setUpdatingEmailTheme(true);
    await adminClient.realms.update(
      { realm: realmName },
      { ...realm, emailTheme: value }
    );
    addAlert('Email theme is now set to "attributes".');
    refresh();
    setTimeout(() => setUpdatingEmailTheme(false), 5000);
    setTemplateSelectDisabled(false);
  };

  return (
    <PageSection variant="light" className="keycloak__form">
      {!hasEmailThemeSettingsEnabled && (
        <Alert variant="warning" title="Realm setting change is required">
          <p>
            Your email theme must be set to <code>attributes</code> for these
            changes to take effect.
          </p>
          <Button
            isSmall
            className="pf-u-mt-sm"
            onClick={() => updateRealmTheme()}
            isLoading={updatingEmailTheme}
            isDisabled={updatingEmailTheme}
          >
            {updatingEmailTheme ? "Activating..." : "Activate"}
          </Button>
        </Alert>
      )}
      <p className="pf-u-mt-lg">
        Use these templates to override the default content of your emails.
      </p>

      <Form className="pf-u-mt-lg pf-u-pb-lg">
        <FormGroup
          fieldId="emailTemplateSelect"
          label={
            <div>
              Select email template to customize{" "}
              {isLoading && <Spinner size="sm" />}
            </div>
          }
        >
          <Select
            variant={SelectVariant.single}
            aria-label="Select email template"
            onToggle={setIsTemplateSelectOpen}
            // @ts-ignore
            onSelect={selectTemplate}
            selections={selectedTemplate}
            isOpen={isTemplateSelectOpen}
            aria-labelledby={"Select email template"}
            isDisabled={templateSelectDisabled}
            placeholderText="Select a template"
            id="emailTemplateSelect"
          >
            {templateSelectOptions}
          </Select>
        </FormGroup>
      </Form>

      <Form isHorizontal className="pf-u-mt-lg">
        {/* HTML Template */}
        <FormGroup
          labelIcon={
            <HelpItem
              helpText="styles:formHelpHtmlTemplate"
              fieldLabelId="htmlEmail"
            />
          }
          label={t("htmlEmail")}
          fieldId="htmlEmail"
          helperTextInvalid={t("styles:formHelpHtmlTemplateInvalid")}
          validated={
            errors.htmlEmail ? ValidatedOptions.error : ValidatedOptions.default
          }
        >
          <KeycloakTextArea
            {...register("htmlEmail", { required: true })}
            id="htmlEmail"
            data-testid="htmlEmail"
            name="htmlEmail"
            rows={7}
            isDisabled={templateSelectDisabled}
            validated={
              errors.htmlEmail
                ? ValidatedOptions.error
                : ValidatedOptions.default
            }
          />
        </FormGroup>

        {/* Text Template */}
        <FormGroup
          labelIcon={
            <HelpItem
              helpText="styles:formHelpTextTemplate"
              fieldLabelId="textEmail"
            />
          }
          label={t("textEmail")}
          fieldId="textEmail"
          helperTextInvalid={t("styles:formHelpTextTemplateInvalid")}
          validated={
            errors.textEmail ? ValidatedOptions.error : ValidatedOptions.default
          }
        >
          <KeycloakTextArea
            {...register("textEmail", { required: true })}
            id="textEmail"
            data-testid="textEmail"
            name="textEmail"
            rows={7}
            isDisabled={templateSelectDisabled}
            validated={
              errors.textEmail
                ? ValidatedOptions.error
                : ValidatedOptions.default
            }
          />
        </FormGroup>

        <SaveReset
          name="emailTemplates"
          save={save}
          reset={reset}
          isActive={!!selectedTemplateId && !isSaving}
        />
      </Form>
    </PageSection>
  );
};

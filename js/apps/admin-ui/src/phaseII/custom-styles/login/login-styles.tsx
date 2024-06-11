import {
  AlertVariant,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  PageSection,
  ValidatedOptions,
} from "@patternfly/react-core";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { HelpItem } from "ui-shared";
import { KeycloakTextInput } from "../../../components/keycloak-text-input/KeycloakTextInput";
import { SaveReset } from "../components/SaveReset";
import { useState, useEffect } from "react";
import { useRealm } from "../../../context/realm-context/RealmContext";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { get } from "lodash-es";
import { useAlerts } from "../../../components/alert/Alerts";
import { ColorPicker } from "../components/ColorPicker";
import { KeycloakTextArea } from "../../../components/keycloak-text-area/KeycloakTextArea";
import { adminClient } from "../../../admin-client";

type LoginStylesType = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  css: string;
};

type LoginStylesArgs = {
  refresh: () => void;
};

const HexColorPattern = "^#([0-9a-f]{3}){1,2}$";

export const LoginStyles = ({ refresh }: LoginStylesArgs) => {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { addAlert, addError } = useAlerts();
  const {
    register,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<LoginStylesType>({
    defaultValues: {
      primaryColor: "",
      secondaryColor: "",
      backgroundColor: "",
      css: "",
    },
  });

  async function loadRealm() {
    const realmInfo = await adminClient.realms.findOne({ realm });
    setFullRealm(realmInfo);

    setValue(
      "primaryColor",
      get(
        realmInfo?.attributes,
        "_providerConfig.assets.login.primaryColor",
        "",
      ),
    );
    setValue(
      "secondaryColor",
      get(
        realmInfo?.attributes,
        "_providerConfig.assets.login.secondaryColor",
        "",
      ),
    );
    setValue(
      "backgroundColor",
      get(
        realmInfo?.attributes,
        "_providerConfig.assets.login.backgroundColor",
        "",
      ),
    );
    setValue(
      "css",
      get(realmInfo?.attributes, "_providerConfig.assets.login.css", ""),
    );
  }

  const [fullRealm, setFullRealm] = useState<RealmRepresentation>();

  useEffect(() => {
    loadRealm();
  }, []);

  const addOrRemoveItem = (
    key: string,
    value: string,
    fullObj: RealmRepresentation,
  ) => {
    let updatedObj = { ...fullObj };
    const fullKeyPath = `_providerConfig.assets.login.${key}`;
    if (value.length > 0) {
      updatedObj = {
        ...updatedObj,
        attributes: {
          ...updatedObj!.attributes,
          [fullKeyPath]: value,
        },
      };
    } else {
      // @ts-ignore
      delete updatedObj["attributes"][fullKeyPath];
    }
    return updatedObj;
  };

  const generateUpdatedRealm = () => {
    const { primaryColor, secondaryColor, backgroundColor, css } = getValues();
    let updatedRealm = {
      ...fullRealm,
    };

    updatedRealm = addOrRemoveItem("primaryColor", primaryColor, updatedRealm);
    updatedRealm = addOrRemoveItem(
      "secondaryColor",
      secondaryColor,
      updatedRealm,
    );
    updatedRealm = addOrRemoveItem(
      "backgroundColor",
      backgroundColor,
      updatedRealm,
    );
    updatedRealm = addOrRemoveItem("css", css, updatedRealm);

    return updatedRealm;
  };

  const save = async () => {
    // update realm with new attributes
    const updatedRealm = generateUpdatedRealm();
    // save values
    try {
      await adminClient.realms.update({ realm }, updatedRealm);
      addAlert("Attributes for realm have been updated.", AlertVariant.success);
      refresh();
    } catch (e) {
      console.error("Could not update realm with attributes.", e);
      addError("Failed to update realm.", e);
    }
  };

  useWatch({
    name: "primaryColor",
    control,
  });
  useWatch({
    name: "secondaryColor",
    control,
  });
  useWatch({
    name: "backgroundColor",
    control,
  });

  return (
    <PageSection variant="light" className="keycloak__form">
      <Form isHorizontal>
        {/* Primary Color */}
        <FormGroup
          labelIcon={
            <HelpItem
              helpText={t("primaryColorHelp")}
              fieldLabelId="primaryColor"
            />
          }
          label={t("primaryColor")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("primaryColorHelpInvalid")}
          validated={
            errors.primaryColor
              ? ValidatedOptions.error
              : ValidatedOptions.default
          }
        >
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("primaryColor")}
                onChange={(color) => setValue("primaryColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <KeycloakTextInput
                {...register("primaryColor", { required: true })}
                type="text"
                id="kc-styles-logo-url"
                data-testid="kc-styles-logo-url"
                pattern={HexColorPattern}
                validated={
                  errors.primaryColor
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
              />
            </FlexItem>
          </Flex>
        </FormGroup>

        {/* Secondary Color */}
        <FormGroup
          labelIcon={
            <HelpItem
              helpText={t("secondaryColorHelp")}
              fieldLabelId="secondaryColor"
            />
          }
          label={t("secondaryColor")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("secondaryColorHelpInvalid")}
          validated={
            errors.secondaryColor
              ? ValidatedOptions.error
              : ValidatedOptions.default
          }
        >
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("secondaryColor")}
                onChange={(color) => setValue("secondaryColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <KeycloakTextInput
                {...register("secondaryColor", { required: true })}
                type="text"
                id="kc-styles-logo-url"
                data-testid="kc-styles-logo-url"
                pattern={HexColorPattern}
                validated={
                  errors.secondaryColor
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
              />
            </FlexItem>
          </Flex>
        </FormGroup>

        {/* Background Color */}
        <FormGroup
          labelIcon={
            <HelpItem
              helpText={t("backgroundColorHelp")}
              fieldLabelId="backgroundColor"
            />
          }
          label={t("backgroundColor")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("backgroundColorHelpInvalid")}
          validated={
            errors.backgroundColor
              ? ValidatedOptions.error
              : ValidatedOptions.default
          }
        >
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("backgroundColor")}
                onChange={(color) => setValue("backgroundColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <KeycloakTextInput
                {...register("backgroundColor", { required: true })}
                type="text"
                id="kc-styles-logo-url"
                data-testid="kc-styles-logo-url"
                pattern={HexColorPattern}
                validated={
                  errors.backgroundColor
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
              />
            </FlexItem>
          </Flex>
        </FormGroup>

        {/* CSS */}
        <FormGroup
          labelIcon={<HelpItem helpText={t("cssHelp")} fieldLabelId="css" />}
          label={t("css")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("cssHelpInvalid")}
          validated={
            errors.css ? ValidatedOptions.error : ValidatedOptions.default
          }
        >
          <KeycloakTextArea
            id="kc-styles-logo-url"
            {...register("css", { required: true })}
            type="text"
            data-testid="kc-styles-logo-url"
            validated={
              errors.css ? ValidatedOptions.error : ValidatedOptions.default
            }
          />
        </FormGroup>

        <SaveReset name="generalStyles" save={save} reset={reset} isActive />
      </Form>
    </PageSection>
  );
};

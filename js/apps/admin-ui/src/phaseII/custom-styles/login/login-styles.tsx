import {
  AlertVariant,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  PageSection,
  ValidatedOptions,
} from "@patternfly/react-core";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { HelpItem, TextAreaControl, TextControl } from "ui-shared";
import { SaveReset } from "../components/SaveReset";
import { useState, useEffect } from "react";
import { useRealm } from "../../../context/realm-context/RealmContext";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { get } from "lodash-es";
import { useAlerts } from "../../../components/alert/Alerts";
import { ColorPicker } from "../components/ColorPicker";
import { useAdminClient } from "../../../admin-client";

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
  const { adminClient } = useAdminClient();
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
          fieldId="primaryColor"
        >
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("primaryColor")}
                onChange={(color) => setValue("primaryColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <TextControl
                type="text"
                id="primaryColor"
                name="primaryColor"
                label=""
                data-testid="primaryColor"
                pattern={HexColorPattern}
                validated={
                  errors.primaryColor
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
                rules={{ required: true }}
              />
              {errors.primaryColor && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant={ValidatedOptions.error}>
                      {t("primaryColorHelpInvalid")}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
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
          fieldId="secondaryColor"
        >
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("secondaryColor")}
                onChange={(color) => setValue("secondaryColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <TextControl
                {...register("secondaryColor", { required: true })}
                type="text"
                id="secondaryColor"
                name="secondaryColor"
                label=""
                data-testid="secondaryColor"
                pattern={HexColorPattern}
                validated={
                  errors.secondaryColor
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
              />
              {errors.secondaryColor && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant={ValidatedOptions.error}>
                      {t("secondaryColorHelpInvalid")}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
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
          fieldId="backgroundColor"
        >
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("backgroundColor")}
                onChange={(color) => setValue("backgroundColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <TextControl
                {...register("backgroundColor", { required: true })}
                type="text"
                id="backgroundColor"
                name="backgroundColor"
                label=""
                data-testid="backgroundColor"
                pattern={HexColorPattern}
                validated={
                  errors.backgroundColor
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
              />
              {errors.backgroundColor && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant={ValidatedOptions.error}>
                      {t("backgroundColorHelpInvalid")}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FlexItem>
          </Flex>
        </FormGroup>

        {/* CSS */}
        <FormGroup
          labelIcon={<HelpItem helpText={t("cssHelp")} fieldLabelId="css" />}
          label={t("css")}
          fieldId="css"
        >
          <TextAreaControl
            id="css"
            name="css"
            type="text"
            label=""
            data-testid="css"
            validated={
              errors.css ? ValidatedOptions.error : ValidatedOptions.default
            }
          />
          {errors.css && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={ValidatedOptions.error}>
                  {t("cssHelpInvalid")}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>

        <SaveReset name="generalStyles" save={save} reset={reset} isActive />
      </Form>
    </PageSection>
  );
};

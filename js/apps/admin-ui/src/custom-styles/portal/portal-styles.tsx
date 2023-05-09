import {
  AlertVariant,
  Checkbox,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  PageSection,
  ValidatedOptions,
} from "@patternfly/react-core";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { HelpItem } from "ui-shared";
import { KeycloakTextInput } from "../../components/keycloak-text-input/KeycloakTextInput";
import { SaveReset } from "../components/SaveReset";
import { useState, useEffect } from "react";
import { useAdminClient } from "../../context/auth/AdminClient";
import { useRealm } from "../../context/realm-context/RealmContext";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { get, mapKeys, pick } from "lodash-es";
import { useAlerts } from "../../components/alert/Alerts";
import { ColorPicker } from "../components/ColorPicker";
import { KeycloakTextArea } from "../../components/keycloak-text-area/KeycloakTextArea";

type PortalStylesType = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  css: string;
  portal_profile_enabled: boolean;
  portal_profile_password_enabled: boolean;
  portal_profile_twofactor_enabled: boolean;
  portal_profile_activity_enabled: boolean;
  portal_profile_linked_enabled: boolean;
  portal_org_enabled: boolean;
  portal_org_details_enabled: boolean;
  portal_org_members_enabled: boolean;
  portal_org_invitations_enabled: boolean;
  portal_org_domains_enabled: boolean;
  portal_org_sso_enabled: boolean;
  portal_org_events_enabled: boolean;
};

type PortalStylesKeys = keyof PortalStylesType;

const visiblityProfileItems: PortalStylesKeys[] = [
  "portal_profile_enabled",
  "portal_profile_password_enabled",
  "portal_profile_twofactor_enabled",
  "portal_profile_activity_enabled",
  "portal_profile_linked_enabled",
];
const visiblityOrganizationItems: PortalStylesKeys[] = [
  "portal_org_enabled",
  "portal_org_details_enabled",
  "portal_org_members_enabled",
  "portal_org_invitations_enabled",
  "portal_org_domains_enabled",
  "portal_org_sso_enabled",
  "portal_org_events_enabled",
];
const visibilityItems = [
  ...visiblityProfileItems,
  ...visiblityOrganizationItems,
];

const HexColorPattern = "^#([0-9a-f]{3}){1,2}$";

export const PortalStyles = () => {
  const { t } = useTranslation("styles");
  const { realm } = useRealm();
  const { adminClient } = useAdminClient();
  const { addAlert, addError } = useAlerts();
  const {
    register,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PortalStylesType>({
    defaultValues: {
      primaryColor: "",
      secondaryColor: "",
      backgroundColor: "",
      css: "",
      portal_profile_enabled: false,
      portal_profile_password_enabled: false,
      portal_profile_twofactor_enabled: false,
      portal_profile_activity_enabled: false,
      portal_profile_linked_enabled: false,
      portal_org_enabled: false,
      portal_org_details_enabled: false,
      portal_org_members_enabled: false,
      portal_org_invitations_enabled: false,
      portal_org_domains_enabled: false,
      portal_org_sso_enabled: false,
      portal_org_events_enabled: false,
    },
  });

  async function loadRealm() {
    const realmInfo = await adminClient.realms.findOne({ realm });
    setFullRealm(realmInfo);

    setValue(
      "primaryColor",
      get(
        realmInfo?.attributes,
        "_providerConfig.assets.portal.primaryColor",
        ""
      )
    );
    setValue(
      "secondaryColor",
      get(
        realmInfo?.attributes,
        "_providerConfig.assets.portal.secondaryColor",
        ""
      )
    );
    setValue(
      "backgroundColor",
      get(
        realmInfo?.attributes,
        "_providerConfig.assets.portal.backgroundColor",
        ""
      )
    );
    setValue(
      "css",
      get(realmInfo?.attributes, "_providerConfig.assets.portal.css", "")
    );

    visibilityItems.map((pi) => {
      const pth = pi.replaceAll("_", ".");
      let val = get(realmInfo?.attributes, `_providerConfig.${pth}`, true);
      if (val === "true") val = true;
      if (val === "false") val = false;
      setValue(pi, val);
    });
  }

  const [fullRealm, setFullRealm] = useState<RealmRepresentation>();

  useEffect(() => {
    loadRealm();
  }, []);

  const addOrRemoveItem = (
    key: string,
    value: string,
    fullObj: RealmRepresentation
  ) => {
    let updatedObj = { ...fullObj };
    const fullKeyPath = `_providerConfig.${key}`;
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

  const updatePortalValues = (
    portalValues: PortalStylesType,
    fullObj: RealmRepresentation
  ) => {
    const portalItems = pick(portalValues, visibilityItems);
    const newPortalItems = mapKeys(
      portalItems,
      (value, key) => `_providerConfig.${key.replaceAll("_", ".")}`
    );

    return {
      ...fullObj,
      attributes: {
        ...fullObj!.attributes,
        ...newPortalItems,
      },
    };
  };

  const generateUpdatedRealm = () => {
    const {
      primaryColor,
      secondaryColor,
      backgroundColor,
      css,
      ...portalValues
    } = getValues();
    let updatedRealm = {
      ...fullRealm,
    };

    // @ts-ignore
    updatedRealm = updatePortalValues(portalValues, updatedRealm);

    updatedRealm = addOrRemoveItem(
      "assets.portal.primaryColor",
      primaryColor,
      updatedRealm
    );
    updatedRealm = addOrRemoveItem(
      "assets.portal.secondaryColor",
      secondaryColor,
      updatedRealm
    );
    updatedRealm = addOrRemoveItem(
      "assets.portal.backgroundColor",
      backgroundColor,
      updatedRealm
    );
    updatedRealm = addOrRemoveItem("assets.portal.css", css, updatedRealm);

    return updatedRealm;
  };

  const save = async () => {
    // update realm with new attributes
    const updatedRealm = generateUpdatedRealm();

    // save values
    try {
      await adminClient.realms.update({ realm }, updatedRealm);
      addAlert("Attributes for realm have been updated.", AlertVariant.success);
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
        <h3 className="pf-c-title pf-m-xl">{t("branding")}</h3>
        {/* Primary Color */}
        <FormGroup
          labelIcon={
            <HelpItem
              helpText="styles:primaryColorHelp"
              fieldLabelId="primaryColor"
            />
          }
          label={t("primaryColor")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("styles:primaryColorHelpInvalid")}
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
              helpText="styles:secondaryColorHelp"
              fieldLabelId="secondaryColor"
            />
          }
          label={t("secondaryColor")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("styles:secondaryColorHelpInvalid")}
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
              helpText="styles:backgroundColorHelp"
              fieldLabelId="backgroundColor"
            />
          }
          label={t("backgroundColor")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("styles:backgroundColorHelpInvalid")}
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
          labelIcon={<HelpItem helpText="styles:cssHelp" fieldLabelId="css" />}
          label={t("css")}
          fieldId="kc-styles-logo-url"
          helperTextInvalid={t("styles:cssHelpInvalid")}
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

        {/* Visibility  */}
        <h3 className="pf-c-title pf-m-xl">{t("visibility")}</h3>

        {/*   Profile */}
        <h4 className="pf-c-title pf-m-lg">{t("profile")}</h4>
        {visiblityProfileItems.map((i) => (
          <Controller
            name={i}
            key={i}
            control={control}
            render={({ field, field: { value } }) => (
              <div className="pf-l-flex pf-m-align-items-center">
                {/* @ts-ignore */}
                <Checkbox id={i} label={t(i)} isChecked={value} {...field} />
                <HelpItem helpText={t(`${i}_tooltip`)} fieldLabelId={i} />
              </div>
            )}
          />
        ))}

        {/*   Organizations */}
        <h4 className="pf-c-title pf-m-lg">{t("organizations")}</h4>
        {visiblityOrganizationItems.map((i) => (
          <Controller
            name={i}
            key={i}
            control={control}
            render={({ field, field: { value } }) => (
              <div className="pf-l-flex pf-m-align-items-center">
                {/* @ts-ignore */}
                <Checkbox id={i} label={t(i)} isChecked={value} {...field} />
                <HelpItem helpText={t(`${i}_tooltip`)} fieldLabelId={i} />
              </div>
            )}
          />
        ))}

        <SaveReset name="generalStyles" save={save} reset={reset} isActive />
      </Form>
    </PageSection>
  );
};

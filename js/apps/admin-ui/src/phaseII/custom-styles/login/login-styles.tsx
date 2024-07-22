import {
  AlertVariant,
  Flex,
  FlexItem,
  Form,
  PageSection,
} from "@patternfly/react-core";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextAreaControl, TextControl } from "@keycloak/keycloak-ui-shared";
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

const HexColorPattern = /^#([0-9a-f]{3}){1,2}$/;

export const LoginStyles = ({ refresh }: LoginStylesArgs) => {
  const { t } = useTranslation();
  const { adminClient } = useAdminClient();
  const { realm } = useRealm();
  const { addAlert, addError } = useAlerts();
  const form = useForm<LoginStylesType>({
    defaultValues: {
      primaryColor: "",
      secondaryColor: "",
      backgroundColor: "",
      css: "",
    },
  });
  const { control, reset, getValues, setValue } = form;

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
        <FormProvider {...form}>
          {/* Primary Color */}
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
                data-testid="primaryColor"
                label={t("primaryColor")}
                labelIcon={t("primaryColorHelp")}
                rules={{
                  required: true,
                  pattern: {
                    value: HexColorPattern,
                    message: t("primaryColorHelp"),
                  },
                }}
                placeholder="#000000"
              />
            </FlexItem>
          </Flex>

          {/* Secondary Color */}
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("secondaryColor")}
                onChange={(color) => setValue("secondaryColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <TextControl
                type="text"
                id="secondaryColor"
                name="secondaryColor"
                label={t("secondaryColor")}
                labelIcon={t("secondaryColorHelp")}
                data-testid="secondaryColor"
                placeholder="#000000"
                rules={{
                  pattern: {
                    value: HexColorPattern,
                    message: t("secondaryColorHelp"),
                  },
                }}
              />
            </FlexItem>
          </Flex>

          {/* Background Color */}
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <ColorPicker
                color={getValues("backgroundColor")}
                onChange={(color) => setValue("backgroundColor", color)}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <TextControl
                type="text"
                id="backgroundColor"
                name="backgroundColor"
                label={t("backgroundColor")}
                labelIcon={t("backgroundColorHelp")}
                data-testid="backgroundColor"
                rules={{
                  pattern: {
                    value: HexColorPattern,
                    message: t("backgroundColorHelp"),
                  },
                }}
              />
            </FlexItem>
          </Flex>

          {/* CSS */}
          <TextAreaControl
            id="css"
            name="css"
            type="text"
            labelIcon={t("cssHelp")}
            label={t("css")}
            data-testid="css"
          />

          <SaveReset name="generalStyles" save={save} reset={reset} isActive />
        </FormProvider>
      </Form>
    </PageSection>
  );
};

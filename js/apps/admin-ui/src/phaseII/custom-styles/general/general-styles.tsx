import {
  AlertVariant,
  Brand,
  Form,
  FormGroup,
  PageSection,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
} from "@patternfly/react-core";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextControl } from "@keycloak/keycloak-ui-shared";
import { SaveReset } from "../components/SaveReset";
import { useState, ReactElement, useEffect } from "react";
import { useRealm } from "../../../context/realm-context/RealmContext";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { get, isEqual } from "lodash-es";
import { useAlerts } from "../../../components/alert/Alerts";
import { useAdminClient } from "../../../admin-client";

type GeneralStylesType = {
  logoUrl: string;
  faviconUrl: string;
  appIconUrl: string;
};

type GeneralStylesArgs = {
  refresh: () => void;
};

const LogoContainer = ({
  title,
  children,
}: {
  title: string;
  children: ReactElement<any, any>;
}) => {
  return (
    <Panel variant="bordered">
      <PanelHeader>{title}</PanelHeader>
      <PanelMain>
        <PanelMainBody>{children}</PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

const InvalidImageError = () => (
  <div>Invalid image url. Please check the link above.</div>
);

const ImageInstruction = ({ name }: { name: string }) => (
  <div>Enter a custom URL for the {name} to preview the image.</div>
);

export const GeneralStyles = ({ refresh }: GeneralStylesArgs) => {
  const { t } = useTranslation();
  const { adminClient } = useAdminClient();
  const { realm } = useRealm();
  const { addAlert, addError } = useAlerts();
  const form = useForm<GeneralStylesType>({
    defaultValues: {
      logoUrl: "",
      faviconUrl: "",
      appIconUrl: "",
    },
  });

  const {
    control,
    reset,
    getValues,
    setError,
    clearErrors,
    setValue,
    formState: { errors, isDirty },
  } = form;

  async function loadRealm() {
    const realmInfo = await adminClient.realms.findOne({ realm });
    setFullRealm(realmInfo);
    setValue(
      "logoUrl",
      get(realmInfo?.attributes, "_providerConfig.assets.logo.url", ""),
    );
    setValue(
      "faviconUrl",
      get(realmInfo?.attributes, "_providerConfig.assets.favicon.url", ""),
    );
    setValue(
      "appIconUrl",
      get(realmInfo?.attributes, "_providerConfig.assets.appicon.url", ""),
    );
  }

  const [logoUrlError, setLogoUrlError] = useState(false);
  const [faviconUrlError, setFaviconUrlError] = useState(false);
  const [appIconUrlError, setAppIconUrlError] = useState(false);
  const [fullRealm, setFullRealm] = useState<RealmRepresentation>();

  useEffect(() => {
    loadRealm();
  }, []);

  const isValidUrl = (
    isValid: boolean,
    formElement: "logoUrl" | "faviconUrl" | "appIconUrl",
    setUrlError: (errorState: boolean) => void,
  ) => {
    if (isValid) {
      clearErrors(formElement);
      setUrlError(false);
    } else {
      setUrlError(true);
      setError(formElement, {
        type: "custom",
        message: t("formHelpImageInvalid"),
      });
    }
  };

  useWatch({
    name: "logoUrl",
    control,
  });
  useWatch({
    name: "faviconUrl",
    control,
  });
  useWatch({
    name: "appIconUrl",
    control,
  });

  const logoUrl = getValues("logoUrl");
  const faviconUrl = getValues("faviconUrl");
  const appIconUrl = getValues("appIconUrl");

  const save = async () => {
    // update realm with new attributes
    const updatedRealm = {
      ...fullRealm,
      attributes: {
        ...fullRealm!.attributes,
        "_providerConfig.assets.logo.url": logoUrl,
        "_providerConfig.assets.favicon.url": faviconUrl,
        "_providerConfig.assets.appicon.url": appIconUrl,
      },
    };

    if (logoUrl.length === 0) {
      //@ts-ignore
      delete updatedRealm["attributes"]["_providerConfig.assets.logo.url"];
    }
    if (faviconUrl.length === 0) {
      //@ts-ignore
      delete updatedRealm["attributes"]["_providerConfig.assets.favicon.url"];
    }
    if (appIconUrl.length === 0) {
      //@ts-ignore
      delete updatedRealm["attributes"]["_providerConfig.assets.appicon.url"];
    }

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

  const LogoUrlBrand = (
    <LogoContainer title={t("logoUrlPreview")}>
      {logoUrl ? (
        logoUrlError ? (
          <InvalidImageError />
        ) : (
          <Brand
            src={logoUrl}
            alt="Custom Logo"
            widths={{ default: "200px" }}
          ></Brand>
        )
      ) : (
        <ImageInstruction name="Logo" />
      )}
    </LogoContainer>
  );

  const FaviconUrlBrand = (
    <LogoContainer title={t("faviconUrlPreview")}>
      {faviconUrl ? (
        faviconUrlError ? (
          <InvalidImageError />
        ) : (
          <Brand
            src={faviconUrl}
            alt="Favicon"
            widths={{ default: "200px" }}
          ></Brand>
        )
      ) : (
        <ImageInstruction name="Favicon" />
      )}
    </LogoContainer>
  );

  const AppIconUrlBrand = (
    <LogoContainer title={t("appIconUrlPreview")}>
      {appIconUrl ? (
        appIconUrlError ? (
          <InvalidImageError />
        ) : (
          <Brand
            src={appIconUrl}
            alt="App Icon"
            widths={{ default: "200px" }}
          ></Brand>
        )
      ) : (
        <ImageInstruction name="App Icon" />
      )}
    </LogoContainer>
  );

  return (
    <PageSection variant="light" className="keycloak__form">
      <Form isHorizontal id="general-styles">
        <FormProvider {...form}>
          {/* Logo Url */}
          <TextControl
            type="text"
            label={t("logoUrl")}
            labelIcon={t("formHelpLogoUrl")}
            id="kc-styles-logo-url"
            data-testid="kc-styles-logo-url"
            name="logoUrl"
            rules={{ required: true }}
          />
          <FormGroup fieldId="kc-styles-logo-url">
            {LogoUrlBrand}
            {logoUrl && (
              <img
                className="pf-v5-u-display-none"
                src={logoUrl}
                onError={() => isValidUrl(false, "logoUrl", setLogoUrlError)}
                onLoad={() => isValidUrl(true, "logoUrl", setLogoUrlError)}
              ></img>
            )}
          </FormGroup>

          {/* Favicon Url */}
          <TextControl
            type="text"
            id="kc-styles-favicon-url"
            name="faviconUrl"
            label={t("faviconUrl")}
            labelIcon={t("formHelpFaviconUrl")}
            data-testid="kc-styles-favicon-url"
            rules={{ required: true }}
          />
          <FormGroup>
            {FaviconUrlBrand}
            {faviconUrl && (
              <img
                className="pf-v5-u-display-none"
                src={faviconUrl}
                onError={() =>
                  isValidUrl(false, "faviconUrl", setFaviconUrlError)
                }
                onLoad={() =>
                  isValidUrl(true, "faviconUrl", setFaviconUrlError)
                }
              ></img>
            )}
          </FormGroup>

          {/* App Icon Url */}

          <TextControl
            type="text"
            id="kc-styles-logo-url"
            label={t("appIconUrl")}
            labelIcon={t("formHelpAppIconUrl")}
            data-testid="kc-styles-logo-url"
            name="appIconUrl"
            rules={{ required: true }}
          />
          <FormGroup>
            {AppIconUrlBrand}
            {appIconUrl && (
              <img
                className="pf-v5-u-display-none"
                src={appIconUrl}
                onError={() =>
                  isValidUrl(false, "appIconUrl", setAppIconUrlError)
                }
                onLoad={() =>
                  isValidUrl(true, "appIconUrl", setAppIconUrlError)
                }
              ></img>
            )}
          </FormGroup>

          <SaveReset
            name="generalStyles"
            save={save}
            reset={reset}
            isActive={isDirty && isEqual(errors, {})}
          />
        </FormProvider>
      </Form>
    </PageSection>
  );
};

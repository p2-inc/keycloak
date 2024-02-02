import { useEffect, useState } from "react";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher from "./useOrgFetcher";
import { useRealm } from "../../context/realm-context/RealmContext";
import {
  ActionGroup,
  Button,
  Text,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  TextVariants,
  Alert,
  AlertGroup,
  AlertVariant,
  Form,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
// import IdentityProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { isNil } from "lodash-es";
import { generatePath } from "react-router-dom";
import { adminClient } from "../../admin-client";
import environment from "../../environment";
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { fetchWithError } from "@keycloak/keycloak-admin-client";
import { addTrailingSlash } from "../../util";
import { getAuthorizationHeaders } from "../../utils/getAuthorizationHeaders";
import { AuthenticationType } from "../../authentication/AuthenticationSection";
import IdentityProviderRepresentation from "../../../../../libs/keycloak-admin-client/lib/defs/identityProviderRepresentation";

export type SyncMode = "FORCE" | "IMPORT" | "LEGACY";
export interface idpRep extends IdentityProviderRepresentation {
  syncMode?: SyncMode;
}

type OrgIdentityProvidersProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

interface AlertInfo {
  title: string;
  variant: AlertVariant;
  key: number;
}

type idpFormValues = {
  idpSelector: IdentityProviderRepresentation["alias"];
  postBrokerLoginFlowAlias: IdentityProviderRepresentation["postBrokerLoginFlowAlias"];
  syncMode: SyncMode;
};
const syncModeOptions = [
  { value: "please choose", label: "Select one", disabled: true },
  { value: "IMPORT", label: "IMPORT", disabled: false },
  { value: "LEGACY", label: "LEGACY", disabled: false },
  { value: "IMPORT", label: "IMPORT", disabled: false },
];

export default function OrgIdentityProviders({
  org,
  refresh,
}: OrgIdentityProvidersProps) {
  const { realm } = useRealm();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { linkIDPtoOrg } = useOrgFetcher(realm);
  const { t } = useTranslation();
  const [idps, setIdps] = useState<idpRep[]>([]);
  const [authFlowOptions, setAuthFlowOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const disabledSelectorText = "please choose";
  const [isUpdatingIdP, setIsUpdatingIdP] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enabledIdP, setEnabledIdP] = useState<idpRep>();
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const getUniqueId: () => number = () => new Date().getTime();

  const idpSelectionForm = useForm<idpFormValues>({
    defaultValues: {
      postBrokerLoginFlowAlias: "post org broker login",
      syncMode: "FORCE",
    },
  });

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = idpSelectionForm;

  async function getIDPs() {
    const identityProviders = (await adminClient.identityProviders.find({
      realm,
    })) as idpRep[];
    setIdps(identityProviders);

    // at least one IdP?
    // find the enabled IdP applicable to this org
    const enabledIdP = identityProviders.find((idp) => {
      // if the key `home.idp.discovery.org` exists
      // and the key is equal to the org id and idp is enabled
      if (isNil(idp.config?.["home.idp.discovery.org"])) {
        return false;
      }
      return idp.config["home.idp.discovery.org"] === org.id && idp.enabled;
    });
    if (enabledIdP) {
      console.log("🚀 ~ getIDPs ~ enabledIdP:", enabledIdP);
      setEnabledIdP(enabledIdP);
      // Set the values for the form since there is an enabled IDP
      setValue("idpSelector", enabledIdP.internalId!);

      if (enabledIdP.postBrokerLoginFlowAlias) {
        setValue(
          "postBrokerLoginFlowAlias",
          enabledIdP.postBrokerLoginFlowAlias,
        );
      }
      if (enabledIdP.syncMode) {
        setValue("syncMode", enabledIdP.syncMode);
      }
    }
  }

  async function getAuthFlowOptions() {
    const flowsRequest = await fetchWithError(
      `${addTrailingSlash(
        adminClient.baseUrl,
      )}admin/realms/${realm}/ui-ext/authentication-management/flows`,
      {
        method: "GET",
        headers: getAuthorizationHeaders(await adminClient.getAccessToken()),
      },
    );
    const flows = await flowsRequest.json();

    if (!flows) {
      return;
    }

    setAuthFlowOptions(
      flows.map((flow: AuthenticationType) => ({
        value: flow.alias,
        label: flow.alias,
      })),
    );
  }

  useEffect(() => {
    getIDPs();
    getAuthFlowOptions();
  }, []);

  const idpOptions = [
    { value: disabledSelectorText, label: "Select one", disabled: false },
    ...idps
      .filter((idp) => idp.internalId !== enabledIdP?.internalId)
      .filter((idp) =>
        isNil(idp.config?.["home.idp.discovery.org"])
          ? true
          : idp.config["home.idp.discovery.org"] === org.id,
      )
      .map((idp) => {
        let label = idp.displayName
          ? `${idp.displayName} (${idp.alias})`
          : `${idp.alias}`;
        if (!isNil(idp.config?.["home.idp.discovery.org"])) {
          label = `${label} - ${org.displayName}`;
        }
        return {
          value: idp.internalId,
          label: label,
          disabled: false,
        };
      }),
  ];

  const saveIdpForm: SubmitHandler<idpFormValues> = async ({
    idpSelector,
    postBrokerLoginFlowAlias,
    syncMode,
  }) => {
    setIsUpdatingIdP(true);
    const fullSelectedIdp = idps.find((i) => i.internalId === idpSelector)!;

    try {
      const resp = await linkIDPtoOrg(org.id, {
        alias: fullSelectedIdp.alias!,
        post_broker_flow: postBrokerLoginFlowAlias,
        sync_mode: syncMode,
      });

      if (resp!.error) {
        throw new Error("Failed to update new IdP.");
      }

      setAlerts((prevAlertInfo) => [
        ...prevAlertInfo,
        {
          title: resp!.message as string,
          variant: AlertVariant.success,
          key: getUniqueId(),
        },
      ]);
    } catch (e) {
      console.log("Error during IdP assignment", e);
      setAlerts((prevAlertInfo) => [
        ...prevAlertInfo,
        {
          title: "IdP failed to update for this org. Please try again.",
          variant: AlertVariant.danger,
          key: getUniqueId(),
        },
      ]);
    } finally {
      setIsUpdatingIdP(false);
      refresh();
    }
  };

  let body = <Text component={TextVariants.h1}>{t("noIDPsAvailable")}</Text>;

  if (idps.length > 0) {
    body = (
      <div>
        <AlertGroup
          isLiveRegion
          aria-live="polite"
          aria-relevant="additions text"
          aria-atomic="false"
        >
          {alerts.map(({ title, variant, key }) => (
            <Alert
              variant={variant}
              title={title}
              key={key}
              timeout={8000}
              className="pf-u-mb-lg"
            />
          ))}
        </AlertGroup>
        <Text component={TextVariants.h1}>
          {enabledIdP ? (
            <>
              <strong>{t("idpAssignedToOrg")}</strong>: {enabledIdP.displayName}{" "}
              ({enabledIdP.alias})
              <Button
                variant="link"
                href={generatePath(
                  `/auth/${environment.consoleBaseUrl}/#/:realm/identity-providers/:providerId/:alias/settings`,
                  {
                    realm,
                    providerId: enabledIdP.providerId!,
                    alias: enabledIdP.alias!,
                  },
                )}
              >
                {t("edit")}
              </Button>
            </>
          ) : (
            <div>{t("noIDPAssigned")}</div>
          )}
        </Text>

        <Grid hasGutter className="pf-u-mt-xl">
          <GridItem span={8}>
            <FormProvider {...idpSelectionForm}>
              <Form onSubmit={handleSubmit(saveIdpForm)}>
                <FormGroup label="Identity Providers*" fieldId="idpSelector">
                  <Controller
                    name="idpSelector"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <FormSelect
                        value={field.value}
                        onChange={field.onChange}
                        aria-label="Identity Providers"
                        ouiaId="Identity Providers"
                        isRequired
                      >
                        {idpOptions.map((option, index) => (
                          <FormSelectOption
                            isDisabled={option.disabled}
                            key={index}
                            value={option.value}
                            label={option.label}
                          />
                        ))}
                      </FormSelect>
                    )}
                  />
                </FormGroup>
                <FormGroup
                  label="Post Broker Login"
                  fieldId="postBrokerLoginFlowAlias"
                >
                  <Controller
                    name="postBrokerLoginFlowAlias"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        value={field.value}
                        onChange={field.onChange}
                        aria-label="Post Broker Login Flow Alias Input"
                        ouiaId="Post Broker Login Flow Alias Input"
                      >
                        {authFlowOptions.map((option, index) => (
                          <FormSelectOption
                            key={index}
                            value={option.value}
                            label={option.label}
                          />
                        ))}
                      </FormSelect>
                    )}
                  />
                </FormGroup>
                <FormGroup label="Sync Mode" fieldId="syncMode">
                  <Controller
                    name="syncMode"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        value={field.value}
                        onChange={field.onChange}
                        aria-label="SyncMode Input"
                        ouiaId="SyncMode Input"
                      >
                        {syncModeOptions.map((option, index) => (
                          <FormSelectOption
                            isDisabled={option.disabled}
                            key={index}
                            value={option.value}
                            label={option.label}
                          />
                        ))}
                      </FormSelect>
                    )}
                  />
                </FormGroup>
                <ActionGroup className="pf-u-mt-xl">
                  <Button
                    type="submit"
                    isDisabled={isUpdatingIdP}
                    isLoading={isUpdatingIdP}
                  >
                    {t("save")}
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => reset()}
                    isDisabled={!isDirty}
                  >
                    {t("cancel")}
                  </Button>
                </ActionGroup>
              </Form>
            </FormProvider>
          </GridItem>
        </Grid>
      </div>
    );
  }

  return <div className="pf-u-p-lg">{body}</div>;
}

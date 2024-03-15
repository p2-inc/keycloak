/* eslint-disable @typescript-eslint/no-unused-vars */

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
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { first, startCase } from "lodash-es";
import { Link, NavLink, generatePath } from "react-router-dom";
import IdentityProviderRepresentation from "../../../../../libs/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { AssignIdentityProvider } from "./modals/AssignIdentityProvider";
import environment from "../../environment";
import { toIdentityProvider } from "../../identity-providers/routes/IdentityProvider";

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
  { value: null, label: "Select one", disabled: false },
  { value: "FORCE", label: "FORCE", disabled: false },
  { value: "LEGACY", label: "LEGACY", disabled: false },
  { value: "IMPORT", label: "IMPORT", disabled: false },
];

export default function OrgIdentityProviders({
  org,
  refresh,
}: OrgIdentityProvidersProps) {
  const { realm } = useRealm();
  const { linkIDPtoOrg, getIdpsForOrg, getIdpsForRealm, unlinkIDPtoOrg } =
    useOrgFetcher(realm);
  const { t } = useTranslation();
  const [orgIdps, setOrgIdps] = useState<IdentityProviderRepresentation[]>([]);
  const [idps, setIdps] = useState<idpRep[]>([]);
  const [authFlowOptions, setAuthFlowOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const disabledSelectorText = "please choose";
  const [isUpdatingIdP, setIsUpdatingIdP] = useState(false);
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

  async function fetchOrgIdps() {
    const orgIdps = await getIdpsForOrg(org.id);
    if ("error" in orgIdps && orgIdps.error) {
      console.error("Error fetching org IdPs", orgIdps.error);
      return;
    }
    setOrgIdps(orgIdps as IdentityProviderRepresentation[]);

    if (Array.isArray(orgIdps) && orgIdps.length > 0) {
      const activeIdP = first(orgIdps);

      if (
        activeIdP &&
        activeIdP.config?.["home.idp.discovery.org"] === org.id &&
        activeIdP.enabled
      ) {
        setEnabledIdP(activeIdP);
        setValue("idpSelector", activeIdP.internalId!);
        if (activeIdP.postBrokerLoginFlowAlias) {
          setValue(
            "postBrokerLoginFlowAlias",
            activeIdP.postBrokerLoginFlowAlias,
          );
        }
        if (activeIdP.config.syncMode) {
          setValue("syncMode", activeIdP.config.syncMode);
        }
      }
    }
  }

  useEffect(() => {
    getIDPs();
    getAuthFlowOptions();
    fetchOrgIdps();
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

  let body = (
    <div>
      <h1 className="pf-u-font-size-xl">{t("noIDPsAvailable")}</h1>
      <NavLink to={`/${realm}/identity-providers`}>
        Add Identity Provider
      </NavLink>
    </div>
  );

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

        {enabledIdP ? (
          <>
            <h1 className="pf-u-font-size-xl pf-u-mb-lg">
              {t("idpAssignedToOrg")}
            </h1>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>{t("name")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {enabledIdP.displayName || t("noName")} (
                  <Link
                    to={toIdentityProvider({
                      realm,
                      providerId: enabledIdP.providerId!,
                      alias: enabledIdP.alias!,
                      tab: "settings",
                    })}
                  >
                    {t("edit").toLowerCase()}
                  </Link>
                  )
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t("alias")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {enabledIdP.alias || t("noAlias")}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </>
        ) : (
          <div>{t("noIDPAssigned")}</div>
        )}

        <h2 className="pf-u-font-size-lg pf-u-mt-lg">{t("assignNewIdp")}</h2>
        <Flex>
          <FlexItem>
            <Button
              data-testid="idpAssign"
              variant="primary"
              onClick={() => setShowAssignIdpModal(true)}
            >
              {t("idpAssign")}
            </Button>
          </FlexItem>
          {enabledIdP && (
            <FlexItem>
              <Button
                data-testid="idpUnassign"
                variant="secondary"
                onClick={() => unlinkIDPtoOrg(org.id)}
              >
                {t("idpUnassign")}
              </Button>
            </FlexItem>
          )}
        </Flex>

        {showAssignIdpModal && (
          <AssignIdentityProvider
            onSelect={(identityProvider, idpConfig) => {
              assignIdentityProvider({
                identityProvider,
                idpConfig: {
                  ...idpConfig,
                  postBrokerLoginFlowAlias:
                    idpConfig.postBrokerLoginFlowAlias || "",
                },
              });
            }}
            onClear={() => setShowAssignIdpModal(false)}
            organization={org}
            alerts={alerts}
          />
        )}
      </div>
    );
  }

  return <div className="pf-u-p-lg">{body}</div>;
}

/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState } from "react";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher from "./useOrgFetcher";
import { useRealm } from "../../context/realm-context/RealmContext";
import {
  Button,
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
import { first } from "lodash-es";
import { Link, NavLink } from "react-router-dom";
import IdentityProviderRepresentation from "../../../../../libs/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { AssignIdentityProvider } from "./modals/AssignIdentityProvider";
import { toIdentityProvider } from "../../identity-providers/routes/IdentityProvider";

export type SyncMode = "FORCE" | "IMPORT" | "LEGACY";
export interface idpRep extends IdentityProviderRepresentation {
  syncMode?: SyncMode;
}

type OrgIdentityProvidersProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

export interface AlertInfo {
  title: string;
  variant: AlertVariant;
  key: number;
}

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

  const [enabledIdP, setEnabledIdP] = useState<idpRep>();
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const getUniqueId: () => number = () => new Date().getTime();

  const [showAssignIdpModal, setShowAssignIdpModal] = useState<boolean>();

  async function getIDPs() {
    const identityProviders = (await getIdpsForRealm({
      first: 0,
      max: 100,
    })) as idpRep[];
    setIdps(identityProviders);
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
        activeIdP?.config?.["home.idp.discovery.org"].includes(org.id) &&
        activeIdP.enabled
      ) {
        setEnabledIdP(activeIdP);
      }
    }
  }

  const refreshIdPs = () => {
    getIDPs();
    fetchOrgIdps();
  };

  useEffect(() => {
    refreshIdPs();
  }, []);

  const assignIdentityProvider = async ({
    identityProvider,
    idpConfig,
  }: {
    identityProvider: IdentityProviderRepresentation;
    idpConfig: { syncMode: SyncMode; postBrokerLoginFlowAlias: string };
  }) => {
    try {
      const resp = await linkIDPtoOrg(org.id, {
        alias: identityProvider.alias!,
        post_broker_flow: idpConfig.postBrokerLoginFlowAlias,
        sync_mode: idpConfig.syncMode,
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
      setShowAssignIdpModal(false);
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
      refresh();
      refreshIdPs();
    }
  };

  const unassignIdentityProvider = async (idpAlias: string) => {
    try {
      const resp = await unlinkIDPtoOrg(org.id, idpAlias);

      if (resp!.error) {
        setAlerts((prevAlertInfo) => [
          ...prevAlertInfo,
          {
            title: resp!.message as string,
            variant: AlertVariant.danger,
            key: getUniqueId(),
          },
        ]);
      } else {
        setAlerts((prevAlertInfo) => [
          ...prevAlertInfo,
          {
            title: resp!.message as string,
            variant: AlertVariant.success,
            key: getUniqueId(),
          },
        ]);
      }
    } catch (e) {
      console.log("Error during IdP unassignment", e);
      setAlerts((prevAlertInfo) => [
        ...prevAlertInfo,
        {
          title: "IdP failed to unassign for this org. Please try again.",
          variant: AlertVariant.danger,
          key: getUniqueId(),
        },
      ]);
    } finally {
      setEnabledIdP(undefined);
      refresh();
      refreshIdPs();
    }
  };

  let body = (
    <div>
      <h1 className="pf-v5-u-font-size-xl">{t("noIDPsAvailable")}</h1>
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
          {alerts
            .filter(({ variant }) => variant === AlertVariant.success)
            .map(({ title, variant, key }) => (
              <Alert
                variant={variant}
                title={title}
                key={key}
                timeout={8000}
                className="pf-v5-u-mb-lg"
              />
            ))}
        </AlertGroup>

        {enabledIdP ? (
          <>
            <h1 className="pf-v5-u-font-size-xl pf-v5-u-mb-lg">
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

        <h2 className="pf-v5-u-font-size-lg pf-v5-u-mt-2xl pf-v5-u-mb-md">
          {t("assignNewIdp")}
        </h2>
        <Flex>
          <FlexItem>
            <Button
              data-testid="assign"
              variant="primary"
              onClick={() => setShowAssignIdpModal(true)}
            >
              {t("assign")}
            </Button>
          </FlexItem>
          {enabledIdP && (
            <FlexItem>
              <Button
                data-testid="idpUnassign"
                variant="secondary"
                onClick={() => unassignIdentityProvider(enabledIdP.alias!)}
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

  return <div className="pf-v5-u-p-lg">{body}</div>;
}

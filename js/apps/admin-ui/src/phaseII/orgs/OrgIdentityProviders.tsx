/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState } from "react";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher from "./useOrgFetcher";
import { useRealm } from "../../context/realm-context/RealmContext";
import {
  Button,
  Text,
  TextVariants,
  Alert,
  AlertGroup,
  AlertVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { first } from "lodash-es";
import { generatePath } from "react-router-dom";
import IdentityProviderRepresentation from "../../../../../libs/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { AssignIdentityProvider } from "./modals/AssignIdentityProvider";

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
  const { linkIDPtoOrg, getIdpsForOrg, getIdpsForRealm } = useOrgFetcher(realm);
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
        activeIdP &&
        activeIdP.config?.["home.idp.discovery.org"] === org.id &&
        activeIdP.enabled
      ) {
        setEnabledIdP(activeIdP);
      }
    }
  }

  useEffect(() => {
    getIDPs();
    fetchOrgIdps();
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
          {alerts
            .filter(({ variant }) => variant === AlertVariant.success)
            .map(({ title, variant, key }) => (
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
              <Button variant="link">
                <a
                  href={generatePath(
                    `?realm=${realm}#/:realm/identity-providers/:providerId/:alias/settings`,
                    {
                      realm,
                      providerId: enabledIdP.providerId!,
                      alias: enabledIdP.alias!,
                    },
                  )}
                >
                  {t("edit")}
                </a>
              </Button>
            </>
          ) : (
            <div>{t("noIDPAssigned")}</div>
          )}
        </Text>

        <Text component={TextVariants.h2}>{t("assignNewIdp")}</Text>
        <Button
          data-testid="idpAssign"
          variant="secondary"
          onClick={() => setShowAssignIdpModal(true)}
        >
          {t("idpAssign")}
        </Button>

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

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
  Card,
  CardTitle,
  Title,
  CardBody,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { first } from "lodash-es";
import { Link, NavLink } from "react-router-dom";
import IdentityProviderRepresentation from "../../../../../libs/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { AssignIdentityProvider } from "./modals/AssignIdentityProvider";
import { toIdentityProvider } from "../../identity-providers/routes/IdentityProvider";
import { Table, Tbody, Th, Thead, Tr, Td } from "@patternfly/react-table";
import {
  CheckCircleIcon,
  StopCircleIcon,
  TrashIcon,
} from "@patternfly/react-icons";

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
    console.log("🚀 ~ fetchOrgIdps ~ orgIdps:", orgIdps);
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
    <Card isFlat>
      <CardTitle>
        <Title headingLevel="h4" size="lg">
          {t("noIDPsAvailable")}
        </Title>
      </CardTitle>
      <CardBody>
        <NavLink to={`/${realm}/identity-providers`}>
          <Button variant="primary" ouiaId="Primary">
            Add Identity Provider
          </Button>
        </NavLink>
      </CardBody>
    </Card>
  );

  const tableHeaders = [
    { title: t("alias"), key: "alias" },
    { title: t("displayName"), key: "displayName" },
    { title: t("enabled"), key: "enabled" },
    {
      title: "actions",
      props: { className: "pf-v5-u-text-align-right pf-v5-u-display-none" },
    },
  ];

  if (idps.length > 0) {
    body = (
      <div>
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
        <Card isFlat>
          <AlertGroup
            isLiveRegion
            aria-live="polite"
            aria-relevant="additions text"
            aria-atomic="false"
          ></AlertGroup>
          {enabledIdP ? (
            <>
              <CardTitle className="pf-v5-u-mt-lg">
                <Title headingLevel="h4" size="lg">
                  {t("idpAssignedToOrg")}
                </Title>
              </CardTitle>
              <CardBody>
                <Table variant="compact" borders={false}>
                  <Thead>
                    <Tr>
                      {tableHeaders.map((header, idx) => (
                        <Th key={idx} {...header.props}>
                          {header.title}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {orgIdps.map((idp, rowIndex) => (
                      <Tr key={rowIndex}>
                        <Td dataLabel={tableHeaders[0].title}>
                          <Link
                            to={toIdentityProvider({
                              realm,
                              providerId: idp.providerId!,
                              alias: idp.alias!,
                              tab: "settings",
                            })}
                          >
                            {idp.alias}
                          </Link>
                        </Td>
                        <Td dataLabel={tableHeaders[1].title}>
                          {idp.displayName || "--"}
                        </Td>
                        <Td dataLabel={tableHeaders[2].title}>
                          {idp.enabled ? (
                            <CheckCircleIcon />
                          ) : (
                            <StopCircleIcon />
                          )}
                        </Td>
                        <Td
                          dataLabel={tableHeaders[3].title}
                          className="pf-v5-u-text-align-right"
                        >
                          <Button
                            variant="plain"
                            onClick={() => unassignIdentityProvider(idp.alias!)}
                            title={t("idpUnassign")}
                          >
                            <TrashIcon />
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </>
          ) : (
            <CardBody className="pf-v5-u-pt-lg">{t("noIDPAssigned")}</CardBody>
          )}
        </Card>
        <div className="pf-v5-u-mt-lg">
          <Button
            data-testid="assign"
            variant="primary"
            onClick={() => setShowAssignIdpModal(true)}
          >
            {t("assignNewIdpShort")}
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
      </div>
    );
  }

  return <div className="pf-v5-u-p-lg">{body}</div>;
}

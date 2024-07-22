import { useState } from "react";
import {
  Action,
  KeycloakDataTable,
} from "../../components/table-toolbar/KeycloakDataTable";
import { useRealm } from "../../context/realm-context/RealmContext";
import type { OrgRepresentation } from "./routes";
import useOrgFetcher from "./useOrgFetcher";
import { Button, ToolbarItem } from "@patternfly/react-core";
import { ListEmptyState } from "../../components/list-empty-state/ListEmptyState";
import AddInvitation from "./AddInvitation";
import { useAlerts } from "../../components/alert/Alerts";
import { useTranslation } from "react-i18next";

type OrgInvitationsTypeProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

export default function OrgInvitations({
  org,
  refresh: refreshOrg,
}: OrgInvitationsTypeProps) {
  const { t } = useTranslation();
  // Table Refresh
  const [key, setKey] = useState(0);
  const refresh = () => {
    setKey(new Date().getTime());
    refreshOrg();
  };

  // Needed State
  const { realm } = useRealm();
  const { getOrgInvitations, deleteOrgInvitation } = useOrgFetcher(realm);
  const { addAlert } = useAlerts();

  const loader = async () => {
    return await getOrgInvitations(org.id);
  };

  // Invite User Modal
  const [invitationModalVisibility, setInvitationModalVisibility] =
    useState(false);
  function toggleInvitationModalVisibility() {
    setInvitationModalVisibility(!invitationModalVisibility);
  }

  async function removeInvitation(row: any): Promise<boolean> {
    await deleteOrgInvitation(org.id, row.id);
    addAlert("Pending invitation removed");
    refresh();
    return true;
  }

  return (
    <>
      {invitationModalVisibility && (
        <AddInvitation
          refresh={refresh}
          org={org}
          toggleVisibility={toggleInvitationModalVisibility}
        />
      )}
      <KeycloakDataTable
        data-testid="invitations-org-table"
        key={key}
        loader={loader}
        ariaLabelKey={t("invitations")}
        toolbarItem={
          <ToolbarItem>
            <Button
              data-testid="addInvitation"
              variant="primary"
              onClick={() => setInvitationModalVisibility(true)}
            >
              Invite User
            </Button>
          </ToolbarItem>
        }
        actions={[
          {
            title: "Remove Pending Invitation",
            onRowClick: removeInvitation,
          } as Action<any>,
        ]}
        columns={[
          {
            name: "email",
            displayKey: "Email",
          },
          {
            name: "createdAt",
            displayKey: "Invited at",
            cellRenderer: (data: any) => {
              const date = new Date(data?.createdAt);
              return <div>{date.toLocaleString()}</div>;
            },
          },
        ]}
        emptyState={
          <ListEmptyState
            message="No Invitations Found"
            instructions="Please invite a user via email address to see a list of invitations"
            primaryActionText="Invite User"
            onPrimaryAction={() => setInvitationModalVisibility(true)}
          />
        }
      />
    </>
  );
}

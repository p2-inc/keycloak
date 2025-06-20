import {
  Button,
  ButtonVariant,
  Divider,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import useOrgFetcher, {
  PhaseTwoOrganizationUserRepresentation,
} from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { useEffect, useState } from "react";
import { TrashAltIcon } from "@patternfly/react-icons";
import { OrgMemberAttribute } from "../form/OrgMemberAttribute";

type AssignRoleToMemberProps = {
  handleModalToggle: () => void;
  refresh: () => void;
  user: PhaseTwoOrganizationUserRepresentation;
  orgId: string;
};

export const ViewOrganizationUserAttributes = ({
  handleModalToggle,
  refresh,
  user,
  orgId,
}: AssignRoleToMemberProps) => {
  console.log("🚀 ~ user:", user);
  const { realm } = useRealm();
  const { t } = useTranslation();

  const { getUserAttributesForOrgMember, updateAttributesForOrgMember } =
    useOrgFetcher(realm);

  const [userAttributes, setUserAttributes] =
    useState<PhaseTwoOrganizationUserRepresentation | null>(null);
  console.log("🚀 ~ userAttributes:", userAttributes);

  const fetchUserAttributes = async () => {
    try {
      const attributes = await getUserAttributesForOrgMember(orgId, user.id!);
      setUserAttributes(attributes);
    } catch (error) {
      console.error("Failed to fetch user attributes:", error);
    }
  };

  useEffect(() => {
    fetchUserAttributes();
  }, []);

  const tableRows = Object.keys(user.organizationAttributes || {}).map(
    (key) => ({
      id: key,
      name: key,
      value: user.organizationAttributes?.[key],
    }),
  );

  const columns = [
    {
      name: "name",
      displayKey: t("userOrganizationAttributeName"),
    },
    {
      name: "value",
      displayKey: t("userOrganizationAttributeValue"),
    },
    {
      name: "action",
      displayKey: t("action"),
    },
  ];

  const removeAttribute = async (row: {
    id: string;
    name: string;
    value: string[];
  }) => {
    try {
      const updatedAttributes = { ...user.organizationAttributes };
      delete updatedAttributes[row.name];
      await updateAttributesForOrgMember(orgId, user.id!, updatedAttributes);
      fetchUserAttributes(); // Refresh attributes after removal
    } catch (error) {
      console.error("Failed to remove attribute:", error);
    }
  };

  const closeModal = () => {
    handleModalToggle();
    refresh();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={`${t("organizationUserAttributes")}: ${user.username || t("user")}`}
      isOpen={true}
      onClose={closeModal}
      actions={[
        <Button
          id="modal-close"
          data-testid="close"
          key="close"
          variant={ButtonVariant.secondary}
          onClick={() => {
            closeModal();
          }}
        >
          {t("close")}
        </Button>,
      ]}
    >
      <OrgMemberAttribute
        orgId={orgId}
        user={user}
        updateUser={fetchUserAttributes}
      />
      <Divider className="pf-v5-u-mt-md" />
      <Table
        aria-label="View organization attributes for a user"
        variant="compact"
      >
        <Thead>
          <Tr>
            {columns.map((c) => (
              <Th key={c.name}>{t(c.displayKey || c.name)}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {tableRows.length === 0 ? (
            <Tr>
              <Td colSpan={2}>{t("noOrganizationUserAttributes")}</Td>
            </Tr>
          ) : (
            tableRows.map((row) => (
              <Tr key={row.id}>
                {columns.map((c) => (
                  <Td key={c.name}>{row[c.name as keyof typeof row]}</Td>
                ))}
                <Td>
                  <Button
                    variant={ButtonVariant.danger}
                    icon={<TrashAltIcon />}
                    onClick={() => removeAttribute(row)}
                  ></Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Modal>
  );
};

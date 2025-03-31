import {
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { PhaseTwoOrganizationUserRepresentation } from "../useOrgFetcher";

type AssignRoleToMemberProps = {
  handleModalToggle: () => void;
  refresh: () => void;
  user: PhaseTwoOrganizationUserRepresentation;
};

export const ViewOrganizationUserAttributes = ({
  handleModalToggle,
  refresh,
  user,
}: AssignRoleToMemberProps) => {
  const { t } = useTranslation();

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
      displayKey: t("attributeName"),
    },
    {
      name: "value",
      displayKey: t("attributeValue"),
    },
  ];

  const closeModal = () => {
    refresh();
    handleModalToggle();
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
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Modal>
  );
};

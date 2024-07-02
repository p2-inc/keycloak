import {
  AlertVariant,
  Button,
  ButtonVariant,
  Checkbox,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Text,
  TextContent,
} from "@patternfly/react-core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAlerts } from "../../../components/alert/Alerts";
import { useFetch } from "../../../utils/useFetch";
import useOrgFetcher from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { isNil } from "lodash-es";

type ManageOrderDialogProps = {
  onClose: () => void;
};

export type OrgConfigType = {
  createAdminUserEnabled: boolean;
  sharedIdpsEnabled: boolean;
};

export const ManageOrgSettingsDialog = ({
  onClose,
}: ManageOrderDialogProps) => {
  const { realm } = useRealm();
  const { getOrgsConfig, updateOrgsConfig } = useOrgFetcher(realm);

  const { t } = useTranslation();
  const { addAlert, addError } = useAlerts();

  const [orgConfig, setOrgConfig] = useState<OrgConfigType | null>(null);

  useFetch(
    () => getOrgsConfig(),
    (config) => {
      if (!("error" in config)) {
        setOrgConfig(config);
      } else {
        addError(t("orgConfigFetchUpdatesError"), config.message);
      }
    },
    [],
  );

  async function updateOrgsConfigForm() {
    if (!orgConfig) {
      return;
    }
    try {
      const resp = await updateOrgsConfig(orgConfig);

      if (resp.success) {
        addAlert(t("orgConfigUpdatedSuccess"), AlertVariant.success);
        onClose();
      } else {
        addError(t("orgConfigUpdatedError"), resp.message);
      }
    } catch (error) {
      console.error("Failed to update org config", error);
    }
  }

  return (
    <Modal
      variant={ModalVariant.small}
      title={t("manageOrgSettings")}
      isOpen
      onClose={onClose}
      actions={[
        <Button
          id="modal-confirm"
          data-testid="confirm"
          key="confirm"
          disabled={isNil(orgConfig)}
          onClick={async () => {
            updateOrgsConfigForm();
          }}
        >
          {t("save")}
        </Button>,
        <Button
          id="modal-cancel"
          data-testid="cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={onClose}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <TextContent className="pf-v5-u-pb-lg">
        <Text>{t("manageOrgSettingsExplainer")}</Text>
      </TextContent>
      <Form>
        <FormGroup
          label={t("createAdminUser")}
          fieldId="createAdminUser"
          disabled={isNil(orgConfig)}
        >
          <Checkbox
            label={t("createAdminUser")}
            aria-label={t("createAdminUser")}
            id="createAdminUser"
            description={t("createAdminUserExplainer")}
            isChecked={orgConfig?.createAdminUserEnabled}
            isDisabled={isNil(orgConfig)}
            onChange={(evt, checked) =>
              setOrgConfig({ ...orgConfig!, createAdminUserEnabled: checked })
            }
          />
        </FormGroup>
        <FormGroup
          label={t("sharedIdps")}
          fieldId="sharedIdps"
          disabled={isNil(orgConfig)}
        >
          <Checkbox
            label={t("sharedIdps")}
            aria-label={t("sharedIdps")}
            id="sharedIdps"
            description={t("sharedIdpsExplainer")}
            isChecked={orgConfig?.sharedIdpsEnabled}
            isDisabled={isNil(orgConfig)}
            onChange={(evt, checked) =>
              setOrgConfig({ ...orgConfig!, sharedIdpsEnabled: checked })
            }
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};

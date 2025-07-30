import {
  Alert,
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
  TextInput,
} from "@patternfly/react-core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpItem, useAlerts } from "@keycloak/keycloak-ui-shared";

import { useFetch } from "@keycloak/keycloak-ui-shared";
import useOrgFetcher from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { isNil } from "lodash-es";

type ManageOrderDialogProps = {
  onClose: () => void;
};

export type OrgConfigType = {
  createAdminUserEnabled: boolean;
  sharedIdpsEnabled: boolean;
  consoleLinkExpiration?: string;
};

export const ManageOrgSettingsDialog = ({
  onClose,
}: ManageOrderDialogProps) => {
  const { realm } = useRealm();
  const { getOrgsConfig, updateOrgsConfig } = useOrgFetcher(realm);

  const { t } = useTranslation();
  const { addAlert, addError } = useAlerts();

  const [orgConfig, setOrgConfig] = useState<OrgConfigType | null>(null);
  const [currentOrgConfig, setCurrentOrgConfig] =
    useState<OrgConfigType | null>(null);

  useFetch(
    () => getOrgsConfig(),
    (config) => {
      if (!("error" in config)) {
        setOrgConfig(config);
        setCurrentOrgConfig(config);
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
          {currentOrgConfig?.sharedIdpsEnabled === true &&
            orgConfig?.sharedIdpsEnabled === false && (
              <Alert
                variant={AlertVariant.warning}
                isInline
                title={t("orgSettingsSharedIdpsWarning")}
                className="pf-v5-u-mt-lg"
              />
            )}
        </FormGroup>
        <FormGroup
          label={t("consoleLinkExpiration")}
          fieldId="consoleLinkExpiration"
          disabled={isNil(orgConfig)}
        >
          <TextInput
            id="consoleLinkExpiration"
            defaultValue={orgConfig?.consoleLinkExpiration}
            placeholder="time in seconds"
            isDisabled={isNil(orgConfig)}
            onChange={(e) =>
              setOrgConfig({
                ...orgConfig!,
                consoleLinkExpiration: e.currentTarget.value,
              })
            }
          />
          <HelpItem
            helpText={t("consoleLinkExpirationHelpText")}
            fieldLabelId="consoleLinkExpiration"
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};

import {
  Alert,
  AlertVariant,
  ClipboardCopy,
  Form,
  FormGroup,
  ModalVariant,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useRealm } from "../../../../../src/context/realm-context/RealmContext";
import { OrgParams } from "../../routes/Org";
import useOrgFetcher from "../../useOrgFetcher";
import { ConfirmDialogModal } from "../../../../../src/components/confirm-dialog/ConfirmDialog";

type PortalLinkProps = {
  id: string;
  open: boolean;
  toggleDialog: () => void;
};

export const PortalLink = ({ id, open, toggleDialog }: PortalLinkProps) => {
  const { t } = useTranslation();
  const { orgId } = useParams<OrgParams>();
  const { realm } = useRealm();
  const { getPortalLink } = useOrgFetcher(realm);
  const [portalLink, setPortalLink] = useState<string | boolean>(false);

  const fetchPortalLink = async () => {
    try {
      const pl = await getPortalLink(orgId!, "");
      setPortalLink(pl?.link);
    } catch (e) {
      setPortalLink("error");
      console.log(e);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPortalLink();
    }
  }, [open]);

  return (
    <ConfirmDialogModal
      titleKey={t("organizationPortal")}
      continueButtonLabel={t("Close")}
      onConfirm={() => {
        return;
      }}
      open={open}
      toggleDialog={toggleDialog}
      variant={ModalVariant.medium}
      noCancelButton
    >
      <Form>
        <Stack hasGutter>
          <StackItem>
            <Alert
              id={id}
              title={t("organizationPortalHelpTitle")}
              variant={AlertVariant.info}
              isInline
            >
              {t("portalLinkHelp")}
            </Alert>
            <Alert
              id={id}
              title={t("organizationPortalHelpTitle")}
              variant={AlertVariant.warning}
              isInline
            >
              {t("portalLinkInformation")}
            </Alert>
          </StackItem>
          <StackItem>
            {portalLink === "error" && (
              <Alert
                id={id}
                title={t("organizationPortalHelpTitle")}
                variant={AlertVariant.danger}
                isInline
              >
                {t("portalLinkHelp")}
              </Alert>
            )}
            {portalLink && (
              <FormGroup fieldId="type" label={t("organizationPortalLink")}>
                <ClipboardCopy isReadOnly>{portalLink}</ClipboardCopy>
              </FormGroup>
            )}
          </StackItem>
        </Stack>
      </Form>
    </ConfirmDialogModal>
  );
};

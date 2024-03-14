import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonVariant,
  Form,
  Modal,
  ModalVariant,
  PageSection,
  Radio,
  FormGroup,
  FormSelect,
  FormSelectOption,
  AlertGroup,
  Alert,
  AlertVariant,
} from "@patternfly/react-core";
import { PaginatingTableToolbar } from "../../../components/table-toolbar/PaginatingTableToolbar";
import IdentityProviderRepresentation from "../../../../../../libs/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import useLocaleSort, { mapByKey } from "../../../utils/useLocaleSort";
import { useFetch } from "../../../utils/useFetch";
import { AlertInfo, SyncMode, idpRep } from "../OrgIdentityProviders";
import useOrgFetcher from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { OrgRepresentation } from "../routes";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { AuthenticationType } from "../../../authentication/AuthenticationSection";
import { fetchWithError } from "../../../../../../libs/keycloak-admin-client/lib/utils/fetchWithError";
import { addTrailingSlash } from "../../../util";
import { adminClient } from "../../../admin-client";
import { getAuthorizationHeaders } from "../../../utils/getAuthorizationHeaders";

type IdentityProviderListProps = {
  list?: IdentityProviderRepresentation[];
  setValue: (provider?: IdentityProviderRepresentation) => void;
  org: OrgRepresentation;
};

const syncModeOptions = [
  { value: null, label: "Select one", disabled: false },
  { value: "FORCE", label: "FORCE", disabled: false },
  { value: "LEGACY", label: "LEGACY", disabled: false },
  { value: "IMPORT", label: "IMPORT", disabled: false },
];

const IdentityProviderList = ({
  list,
  setValue,
  org,
}: IdentityProviderListProps) => {
  console.log("🚀 ~ list:", list);
  const { t } = useTranslation();
  return (
    <PageSection variant="light" className="pf-u-py-lg">
      <Form isHorizontal>
        {list?.map((identityProvider) => {
          const idpAssignedToThisOrg =
            identityProvider.config?.["home.idp.discovery.org"] === org.id;

          return (
            <Radio
              id={identityProvider.internalId!}
              key={identityProvider.internalId}
              name="identityProvider"
              label={`${identityProvider.displayName} ${
                identityProvider.enabled ? "(enabled)" : ""
              } ${idpAssignedToThisOrg ? `[${t("idpAssignedToOrg")}]` : ""}`}
              data-testid={identityProvider.internalId}
              description={identityProvider.alias}
              onChange={() => {
                setValue(identityProvider);
              }}
              isDisabled={idpAssignedToThisOrg}
              title={idpAssignedToThisOrg ? t("idpAssignedToOrg") : ""}
            />
          );
        })}
      </Form>
    </PageSection>
  );
};

type AssignIdentityProviderProps = {
  onSelect: (
    identityProvider: IdentityProviderRepresentation,
    idpConfig: idpFormValues,
  ) => void;
  onClear: () => void;
  organization: OrgRepresentation;
  alerts: AlertInfo[];
};

type idpFormValues = {
  postBrokerLoginFlowAlias: IdentityProviderRepresentation["postBrokerLoginFlowAlias"];
  syncMode: SyncMode;
};

export function AssignIdentityProvider({
  onSelect,
  onClear,
  organization,
  alerts,
}: AssignIdentityProviderProps) {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { getIdpsForRealm } = useOrgFetcher(realm);

  const [value, setValue] = useState<IdentityProviderRepresentation>();
  const [identityProviders, setIdentityProviders] =
    useState<IdentityProviderRepresentation[]>();
  const [max, setMax] = useState(10);
  const [first, setFirst] = useState(0);
  const [search, setSearch] = useState("");
  const localeSort = useLocaleSort();
  const [authFlowOptions, setAuthFlowOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const idpSelectionForm = useForm<idpFormValues>({
    defaultValues: {
      postBrokerLoginFlowAlias: "post org broker login",
      syncMode: "FORCE",
    },
  });

  const {
    control,
    setValue: setFormValue,
    getValues: getFormValues,
  } = idpSelectionForm;

  useEffect(() => {
    setFormValue("postBrokerLoginFlowAlias", value?.postBrokerLoginFlowAlias);
    //@ts-ignore
    setFormValue("syncMode", value?.config?.syncMode);
  }, [value]);

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

  useEffect(() => {
    getAuthFlowOptions();
  }, []);

  const page = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return localeSort(identityProviders ?? [], mapByKey("displayName"))
      .filter(
        ({ displayName }) =>
          displayName?.toLowerCase().includes(normalizedSearch),
      )
      .slice(first, first + max + 1);
  }, [identityProviders, search, first, max]);

  useFetch(
    async () => {
      const args: { first: number; max: number; search?: string } = {
        first,
        max,
        search: search || undefined,
      };
      return (await getIdpsForRealm(args)) as idpRep[];
    },
    (identityProviders) => {
      setIdentityProviders(identityProviders);
    },
    [search],
  );

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={true}
      title={t("assignIdentityProviderTo", { organization })}
      onClose={() => onClear()}
      actions={[
        <Button
          id="modal-add"
          data-testid="modal-add"
          key="add"
          isDisabled={!value}
          onClick={() => onSelect(value!, getFormValues() as idpFormValues)}
        >
          {t("assign")}
        </Button>,
        <Button
          data-testid="cancel"
          id="modal-cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={() => {
            onClear();
          }}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <AlertGroup
        isLiveRegion
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
      >
        {alerts
          .filter(({ variant }) => variant === AlertVariant.danger)
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
      {identityProviders && (
        <PaginatingTableToolbar
          count={page.length || 0}
          first={first}
          max={max}
          onNextClick={setFirst}
          onPreviousClick={setFirst}
          onPerPageSelect={(first, max) => {
            setFirst(first);
            setMax(max);
          }}
          inputGroupName="search"
          inputGroupPlaceholder={t("search")}
          inputGroupOnEnter={setSearch}
        >
          <IdentityProviderList
            list={page.slice(0, max)}
            setValue={setValue}
            org={organization}
          />
        </PaginatingTableToolbar>
      )}
      <FormProvider {...idpSelectionForm}>
        <Form>
          <FormGroup
            label="Post Broker Login"
            fieldId="postBrokerLoginFlowAlias"
          >
            <Controller
              name="postBrokerLoginFlowAlias"
              control={control}
              render={({ field }) => (
                <FormSelect
                  value={field.value}
                  onChange={field.onChange}
                  aria-label="Post Broker Login Flow Alias Input"
                  ouiaId="Post Broker Login Flow Alias Input"
                >
                  {authFlowOptions.map((option, index) => (
                    <FormSelectOption
                      key={index}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              )}
            />
          </FormGroup>
          <FormGroup label="Sync Mode" fieldId="syncMode">
            <Controller
              name="syncMode"
              control={control}
              render={({ field }) => (
                <FormSelect
                  value={field.value}
                  onChange={field.onChange}
                  aria-label="SyncMode Input"
                  ouiaId="SyncMode Input"
                >
                  {syncModeOptions.map((option, index) => (
                    <FormSelectOption
                      isDisabled={option.disabled}
                      key={index}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              )}
            />
          </FormGroup>
        </Form>
      </FormProvider>
    </Modal>
  );
}

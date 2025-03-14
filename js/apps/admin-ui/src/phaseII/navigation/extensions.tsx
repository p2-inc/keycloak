import { NavGroup } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router-dom";
import { LeftNav } from "../../PageNav";
import { useAccess } from "../../context/access/Access";
import { AddRealmRoute } from "../../realm/routes/AddRealm";

const Extensions = () => {
  const { t } = useTranslation();
  const { hasSomeAccess } = useAccess();
  const isOnAddRealm = !!useMatch(AddRealmRoute.path);

  const showOrgs = hasSomeAccess("view-organizations", "manage-organizations");

  return (
    <NavGroup aria-label={t("extensions")} title={t("extensions")}>
      {showOrgs && <LeftNav title={t("orgList")} path="/ext-organizations" />}
      <LeftNav title={t("styles")} path="/ext-styles" />
    </NavGroup>
  );

  return !isOnAddRealm ? (
    <NavGroup aria-label={t("extensions")} title={t("extensions")}>
      {showOrgs && <LeftNav title={t("orgList")} path="/ext-organizations" />}
      <LeftNav title={t("styles")} path="/ext-styles" />
    </NavGroup>
  ) : null;
};

export default Extensions;

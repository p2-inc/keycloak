import { NavGroup } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router-dom";
import { LeftNav } from "../../PageNav";
import { useAccess } from "../../context/access/Access";
import { AddRealmRoute } from "../../realm/routes/AddRealm";

const Extensions = () => {
  const { t } = useTranslation("orgs");
  const { hasSomeAccessByString } = useAccess();
  const isOnAddRealm = !!useMatch(AddRealmRoute.path);

  const showOrgs = hasSomeAccessByString(
    "view-organizations",
    "manage-organizations"
  );

  return !isOnAddRealm ? (
    <NavGroup aria-label={t("extensions")} title={t("extensions")}>
      {showOrgs && <LeftNav title={t("orgList")} path="/organizations" />}
      <LeftNav title={t("styles")} path="/styles" />
    </NavGroup>
  ) : null;
};

export default Extensions;

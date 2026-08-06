import { useTranslation } from "react-i18next";
import { PageSection } from "@patternfly/react-core";

import {
  describeAccessType,
  type ExtendedAccessType,
} from "./phaseII/access/access";

type ForbiddenSectionProps = {
  permissionNeeded: ExtendedAccessType | ExtendedAccessType[];
};

export const ForbiddenSection = ({
  permissionNeeded,
}: ForbiddenSectionProps) => {
  const { t } = useTranslation();
  const permissionNeededArray = Array.isArray(permissionNeeded)
    ? permissionNeeded
    : [permissionNeeded];

  const permissionNames = permissionNeededArray
    .map(describeAccessType)
    .filter((name) => name !== "");

  return (
    <PageSection>
      {permissionNames.length === 0 ? (
        t("forbiddenAdminConsole")
      ) : (
        <>
          {t("forbidden", { count: permissionNames.length })}{" "}
          {permissionNames.join(", ")}
        </>
      )}
    </PageSection>
  );
};

import { useMatches } from "react-router-dom";

import { ForbiddenSection } from "../ForbiddenSection";
import { useAccess } from "../context/access/Access";
import type { ExtendedAccessType } from "../phaseII/access/access";

function hasProp<K extends PropertyKey>(
  data: object,
  prop: K,
): data is Record<K, unknown> {
  return prop in data;
}

export const AuthWall = ({ children }: any) => {
  const matches = useMatches();
  const { hasAccess } = useAccess();

  const permissionNeeded = matches.flatMap(({ handle }) => {
    if (
      typeof handle !== "object" ||
      handle === null ||
      !hasProp(handle, "access")
    ) {
      return [];
    }

    if (Array.isArray(handle.access)) {
      return handle.access as ExtendedAccessType[];
    }

    return [handle.access] as ExtendedAccessType[];
  });

  if (!hasAccess(...permissionNeeded)) {
    return <ForbiddenSection permissionNeeded={permissionNeeded} />;
  }

  return children;
};

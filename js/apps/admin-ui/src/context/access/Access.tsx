import type { AccessType } from "@keycloak/keycloak-admin-client/lib/defs/whoAmIRepresentation";
import { PropsWithChildren, useEffect, useState } from "react";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useWhoAmI } from "../../context/whoami/WhoAmI";
import { createNamedContext, useRequiredContext } from "ui-shared";

type ExtendedAccessType =
  | AccessType
  | "view-organizations"
  | "manage-organizations";

type AccessContextProps = {
  hasAccess: (...types: ExtendedAccessType[]) => boolean;
  hasSomeAccess: (...types: ExtendedAccessType[]) => boolean;
};

export const AccessContext = createNamedContext<AccessContextProps | undefined>(
  "AccessContext",
  undefined,
);

export const useAccess = () => useRequiredContext(AccessContext);

export const AccessContextProvider = ({ children }: PropsWithChildren) => {
  const { whoAmI } = useWhoAmI();
  const { realm } = useRealm();
  const [access, setAccess] = useState<readonly ExtendedAccessType[]>([]);

  useEffect(() => {
    if (whoAmI.getRealmAccess()[realm]) {
      setAccess(whoAmI.getRealmAccess()[realm]);
    }
  }, [whoAmI, realm]);

  const hasAccess = (...types: ExtendedAccessType[]) => {
    return types.every((type) => type === "anyone" || access.includes(type));
  };

  const hasSomeAccess = (...types: ExtendedAccessType[]) => {
    return types.some((type) => type === "anyone" || access.includes(type));
  };

  return (
    <AccessContext.Provider value={{ hasAccess, hasSomeAccess }}>
      {children}
    </AccessContext.Provider>
  );
};

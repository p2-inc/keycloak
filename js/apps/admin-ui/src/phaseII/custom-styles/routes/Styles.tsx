import { lazy } from "react";
import { generatePath } from "react-router-dom";
import type { AppRouteObject } from "../../../routes";
import type { Path } from "react-router-dom";

export type StylesTab = "general" | "login" | "email" | "portal";

export type StylesParams = {
  realm: string;
  tab?: StylesTab;
};

const StylesSection = lazy(() => import("../StylesSection"));

export const StylesRoute: AppRouteObject = {
  path: "/:realm/styles",
  element: <StylesSection />,
  handle: {
    access: "query-clients",
  },
  breadcrumb: (t) => t("styles"),
};

export const StylesRouteWithTab: AppRouteObject = {
  ...StylesRoute,
  path: "/:realm/styles/:tab",
};

export const toStyles = (params: StylesParams): Partial<Path> => {
  const path = params.tab ? StylesRouteWithTab.path : StylesRoute.path;

  return {
    pathname: generatePath(path, params),
  };
};

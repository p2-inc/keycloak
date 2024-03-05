# Phase// Customizations

P// has added a lot of additional functionality to the Admin UI. Those are cordoned off as much as possible from the main Admin UI repo to keep them from being clobbered by various updates to the main Admin UI repo. The list below is the area of customizations.

- Install
  - `lodash-es`
    - TODO: remove usage of this in phaseII
  - `react-colorful`
- `PageNav.tsx`
  - Extensions nav group imported from the `phaseII/navigation` folder
  - Export Left Nav for use in the `extensions` file.
- `src/context/access/Access.tsx`
  - Import `ExtendedAccessType` from `phaseII/access/access.tsx`
  - Adjust the functions to use that type, from `AccessType` to `ExtendedAccessType`
- Include the routes for the Phase II orgs and styles in `admin-ui/src/routes`
- Translations
  - In `maven-resources/theme` copy the `phasetwo.v2` repo.
- Orgs
  - This folder contains all the Orgs UI. It exists mostly independent of other code, but does import components from the `ui-shared` and the `src/components` folder.
  - Check all references and imports for changes in location. The KC maintainers have a tendency to move these around a lot. Confirm the imports have also not changed functionality.
- Custom Styles
  - This folder contains all the Custom Styles UI. It exists mostly independent of other code, but does import components from the `ui-shared` and the `src/components` folder.
- Realm Settings Attributes Tab
  - A tab to allow setting and configuring the realm settings.
  - Needs to be imported and added as a tab in `../realm-settings/RealmSettingsTabs.tsx`
  - Add `attributes` as a tab option to the type def in `../realm-settings/routes/RealmSettings.tsx`
- Help URLs
  - In the `/js/apps/admin-ui/src/help-urls.ts` file import `PhaseTwoHelpUrls` and spread it into the object
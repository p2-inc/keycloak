# Phase// Customizations

P// has added a lot of additional functionality to the Admin UI. Those are cordoned off as much as possible from the main Admin UI repo to keep them from being clobbered by various updates to the main Admin UI repo. The list below is the area of customizations.

- `PageNav.tsx`
  - Extensions nav group imported from the `phaseII/navigation` folder
  - Export Left Nav for use in the `extensions` file.
- Include the routes for the Phase II orgs and styles in `admin-ui/src/routes`
- Translations
  - Files have to live in the `/js/apps/admin-ui/public/locales/en` folder
  - `orgs.json`
  - `styles.json`
  - Ensure these are listed in the `/js/apps/admin-ui/src/i18n/i18n.ts` file as one of the `ns` options
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
  - In the `/js/apps/admin-ui/src/help-urls.ts` file there are two links to the Phase Two docs for orgs and customizing the UI
- Add `hasSomeAccessByString` to the `Access.tsx` file for use with `useAccess`
- Make sure the `react-colorful` is added to support the `ColorPicker`

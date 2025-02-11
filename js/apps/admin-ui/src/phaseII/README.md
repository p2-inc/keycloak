# Phase// Customizations

P// has added a lot of additional functionality to the Admin UI. Those are cordoned off as much as possible from the main Admin UI repo to keep them from being clobbered by various updates to the main Admin UI repo. The list below is the area of customizations.

- Copy the `phaseII` folder into the new fork made from the newest KC tag release.
- Building
  - Make sure to merge all changes in the `admin-ui/pom.xml` file so that the correct name and resources are built.
- Install
  - `react-colorful`
- `PageNav.tsx`
  - Extensions nav group imported from the `phaseII/navigation` folder
  - Export Left Nav for use in the `extensions` file.
- `src/context/access/Access.tsx`
  - Import `ExtendedAccessType` from `phaseII/access/access.tsx`
  - Adjust the functions to use that type, from `AccessType` to `ExtendedAccessType`
- Include the routes for the Phase II orgs and styles in `admin-ui/src/routes`
- Translations
  - In `maven-resources/theme/keycloak.v2/` and `maven-resources-community/theme/keycloak.v2/` change the directory name to `phasetwo.v2`
  - In `maven-resources/META-INF/keycloak-themes.json` rename `keycloak.v2` to `phasetwo.v2`
  - At the bottom of `maven-resources/theme/phasetwo.v2/admin/messages/messages_en.properties` append the section called "phasetwo additions". This must be **added** to the current Keycloak version, as they change a lot of things every release.
- Orgs
  - This folder contains all the Orgs UI. It exists mostly independent of other code, but does import components from the `ui-shared` and the `src/components` folder.
  - Check all references and imports for changes in location. The KC maintainers have a tendency to move these around a lot. Confirm the imports have also not changed functionality.
- User
  - This folder contains a new tab for the User details view.
  - In `admin-ui/src/user/routes/User.tsx` > UserTab add `user-orgs`
  - In `admin-ui/src/user/EditUser.tsx` import `UserOrgs`, add the `userOrgsTab` and add the `<Tab><UsersOrgs />...`
- Custom Styles
  - This folder contains all the Custom Styles UI. It exists mostly independent of other code, but does import components from the `ui-shared` and the `src/components` folder.
- Realm Settings Attributes Tab `realmSettingsTabs.tsx`
  - A tab to allow setting and configuring the realm settings.
  - Needs to be imported and added as a tab in `../realm-settings/RealmSettingsTabs.tsx`
  - Add `attributes` as a tab option to the type def in `../realm-settings/routes/RealmSettings.tsx`
- Help URLs
  - In the `/js/apps/admin-ui/src/help-urls.ts` file import `PhaseTwoHelpUrls` and spread it into the object
- TextAreaControl in ui-shared
  - `rows={props.rows}` to the `TextArea` to allow passing through (allows setting rows number height)
- In `vite.config.ts` update `outDir` to be `phasetwo.v2` instead of `keycloak.v2`

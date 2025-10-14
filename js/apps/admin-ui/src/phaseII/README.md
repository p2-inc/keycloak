# Phase// Customizations

## Running App

Starting and running the Admin UI without anything else is somewhat of a pain. Use these instructions (unless something gets changed again)

The [CONTRIBUTING.md](../../CONTRIBUTING.md) file contains the general information for doing a local development admin ui server.

1. If possible, use a Phase Two image for this. It contains the extensions needed for getting things to work. To make this work, copy the contents of `start-server-custom.js` file from [start-server-custom.js](./start-server-custom.js) to the `/js/apps/keycloak-server/scripts/start-server.js` file. Use the command as `pnpm start --admin-dev --phasetwo --tag=<tab>` or omit for latest. This will start a local Keycloak server with the Phase Two extensions and features enabled. To get this to work fully, you must also copy the `/theme/phasetwo.v2` as a duplicate in the same spot and rename it to `keycloak.v2` (or update the `vite.config.ts` file to output to `phasetwo.v2` instead of `keycloak.v2`).
1. Or start the local Keycloak image in the [`/js/apps/keycloak-server`](/js/apps/keycloak-server/README.md) folder. Follow the instructions in the readme and start the local server with `pnpm start --admin-dev`. Then disable items in the PageNav to see things
1. Start the local dev server at the root of the `admin-ui` [`/js/apps/admin-ui`](/js/apps/admin-ui/) repo with `pnpm dev` (run `pnpm i` first)
1. Open `localhost:8080` to start working

## Customizations

P// has added a lot of additional functionality to the Admin UI. Those are cordoned off as much as possible from the main Admin UI repo to keep them from being clobbered by various updates to the main Admin UI repo. The list below is the area of customizations.

- Copy the `phaseII` folder into the new fork made from the newest KC tag release. This should go into the `js/apps/admin-ui/src`.
- Building
  - Make sure to merge all changes in the `admin-ui/pom.xml` file so that the correct name and resources are built.

  ```
  <groupId>io.phasetwo</groupId>
    <artifactId>phasetwo-admin-ui</artifactId>
    <version>26.1.2</version>

    <properties>
        <admin-ui.theme.name>phasetwo.v2</admin-ui.theme.name>
    </properties>
  ```

- Install
  - `react-colorful`
- `PageNav.tsx`
  - Extensions nav group imported from the `phaseII/navigation` folder
  - Export Left Nav for use in the `extensions` file.
  - Add the `<Extensions />` component to the Nav
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
- Realm Settings Attributes Tab `RealmSettingsTabs.tsx`
  - A tab to allow setting and configuring the realm settings.
  - Needs to be imported and added as a tab in `../realm-settings/RealmSettingsTabs.tsx`
  - Add `attributes` as a tab option to the type def in `../realm-settings/routes/RealmSettings.tsx`
- Help URLs
  - In the `/js/apps/admin-ui/src/help-urls.ts` file import `PhaseTwoHelpUrls` and spread it into the object
- TextAreaControl in ui-shared
  - this has been updated by the Keycloak team, leave to check for now spread the props to allow row passing `{...props}` to the `TextArea` to allow passing through (allows setting rows number height)
- In `vite.config.ts` update `outDir` to be `phasetwo.v2` instead of `keycloak.v2`

## Verify

Once done, make sure to test a build with the following:

`mvn clean package -pl :phasetwo-admin-ui -am -DskipTests`

## Building for Prod

From Root, run `mvn clean package -pl :phasetwo-admin-ui -am -DskipTests`, then copy the built jar from `/js/apps/admin-ui/target/phasetwo-admin-ui-<version>.jar` to the `phasetwo-container` repo.

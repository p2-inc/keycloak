# Phase// Customizations

## Running App

Starting and running the Admin UI without anything else is somewhat of a pain. Use these instructions (unless something gets changed again)

The [CONTRIBUTING.md](../../CONTRIBUTING.md) file contains the general information for doing a local development admin ui server.

### Development Server Options

#### Option 1: Using Phase Two Container (Recommended)

Use the custom start server script to run against a Phase Two Keycloak container:

```bash
# From the keycloak-server directory
cd /js/apps/keycloak-server

# Start Phase Two container with admin dev mode
node ../admin-ui/src/phaseII/start-server-custom.js --phasetwo --admin-dev

# Or with a specific tag
node ../admin-ui/src/phaseII/start-server-custom.js --phasetwo --tag=26.0.2 --admin-dev
```

**Available Flags:**

- `--phasetwo` - Use Phase Two Keycloak Docker container instead of nightly build
- `--tag=<version>` - Specify Phase Two image tag (default: latest)
- `--admin-dev` - Enable admin UI development mode (serves from http://localhost:5174)
- `--account-dev` - Enable account UI development mode (serves from http://localhost:5173)
- `--local` - Use locally built Keycloak distribution

**Requirements:**

- Docker must be installed and running
- Phase Two extensions and features are automatically enabled

#### Option 2: Using Standard Keycloak

Start the local Keycloak image in the [`/js/apps/keycloak-server`](/js/apps/keycloak-server/README.md) folder:

```bash
pnpm start --admin-dev
```

Then disable items in the PageNav to see things.

### Starting the Admin UI Dev Server

After starting Keycloak (using either option above):

1. Navigate to the admin-ui directory: `cd /js/apps/admin-ui`
2. Install dependencies if needed: `pnpm i`
3. Start the dev server: `pnpm dev`
4. Open `localhost:8080` to start working

**Note:** To get Phase Two features to work fully, you must also copy the `/theme/phasetwo.v2` as a duplicate in the same spot and rename it to `keycloak.v2` (or update the `vite.config.ts` file to output to `phasetwo.v2` instead of `keycloak.v2`).

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

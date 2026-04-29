fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Archive Release and export an App Store / TestFlight IPA (uses ExportOptions.plist)

### ios setup_app_store

```sh
[bundle exec] fastlane ios setup_app_store
```

Create App ID (Dev Portal) + new app (App Store Connect) if missing. Run once; uses Appfile. Interactive: 2FA.

### ios first_testflight

```sh
[bundle exec] fastlane ios first_testflight
```

Create ASC app (if needed) then upload IPA to TestFlight

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Upload existing IPA to TestFlight (pilot). Requires App Store Connect API key OR FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD (altool does not use the normal ASC web session).

### ios upload_testflight

```sh
[bundle exec] fastlane ios upload_testflight
```

Alias for beta — upload IPA to TestFlight

### ios ship

```sh
[bundle exec] fastlane ios ship
```

Build IPA then upload to TestFlight

### ios update_testflight_beta_info

```sh
[bundle exec] fastlane ios update_testflight_beta_info
```

Update TestFlight fields on the latest processed build: Beta App Description, feedback email, What to Test (changelog), beta app review contact. Edit fastlane/testflight/*.txt first.

### ios import_external_testers

```sh
[bundle exec] fastlane ios import_external_testers
```

Add external testers from fastlane/testflight/external_testers.csv (columns: FirstName,LastName,email). Copy external_testers.example.csv to external_testers.csv. Set TESTFLIGHT_EXTERNAL_GROUP to the exact group name from TestFlight (defaults to External Testing).

### ios upload_metadata

```sh
[bundle exec] fastlane ios upload_metadata
```

Upload App Store Connect listing only (fastlane/metadata + review_information). No binary. Set API key or app-specific password for 2FA.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

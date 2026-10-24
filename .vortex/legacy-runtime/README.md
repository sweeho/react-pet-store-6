# Legacy runtime: Java Pet Store 1.3.2

Starts the legacy J2EE application for the acceptance suite. The source is built
unchanged by its own Ant scripts (`setup.sh`, `setup.xml`), and runs on the J2EE
1.3.1 reference implementation, which embeds Cloudscape (database) and JMS.

## Start

```sh
export J2EE_SDK_DIR=/path/to/j2sdkee1.3.1
docker compose -f .vortex/legacy-runtime/compose.yaml up --build
```

The first start runs `setup.sh`, starts Cloudscape and the J2EE server, then runs
`setup.sh deploy`. The service reports healthy once `/petstore/` answers.
Stop with `docker compose -f .vortex/legacy-runtime/compose.yaml down`.

## URL the acceptance suite uses

`http://localhost:8000/petstore` (storefront). Also served: `/admin/` and `/supplier/`.
Change the host port with `LEGACY_HTTP_PORT`.

## Not in the repository

- **J2EE SDK 1.3.1** (Sun licence, separate download). Mounted from the host at
  `J2EE_SDK_DIR` and used as `J2EE_HOME`. Compose refuses to start without it.
- **A JDK**: `LEGACY_JDK_IMAGE` (default `eclipse-temurin:8-jdk`). Pet Store needs
  J2SE 1.4.1 or higher; use an older JDK image if the RI rejects the default.
- **The legacy source**: fetched from branch `vortex/legacy-spec/sx-0001`
  (`legacy-source/petstore1.3.2`) of this repository. Set `LEGACY_SOURCE_CONTEXT`
  to a local checkout path to build without network access.
- No licence key or JDBC driver is needed beyond the above; the Cloudscape driver
  ships with the SDK.

## Status

Not run end to end here: the J2EE SDK 1.3.1 is not available in the build
environment, so the startup sequence follows `docs/installing.html` of the legacy
source and is unverified.

# universe-log

Universal javascript log for node and browser. Suitable for libraries and microservices. Configurable via env and window. Extendable

Main aim of universe log is the easiness of configuration via ENV variables. Universe log main goals:

-   Configuration via portable env variables: window.LOG_FORMAT works as well as process.env.LOG_FORMAT

-   Pluggable configuration via scoped env variables: choose WISE_LOG_LEVEL to set log level across all wise libraries,
    or use WISE_HUB_CORE_LEVEL to tune log level of wise-core library solely. Importance stack is specified in abstract class sonstructor

-   log format is configurable via LOG_FORMAT field. When you set it to `json` it will produce logs with extra metadata:
    error stacks, custom errors (with cause), timestamps, and project specific metadata.

### Install

```bash
$ npm install --save universe-log
```

### Use in your project (typescript)

Best practice to use universe-log is to create a singleton Log class in your project that extends AbstractUniverseLog.

```typescript
import { AbstractUniverseLog, PortableEnv } from "universe-log";

export class Log extends AbstractUniverseLog {
    public static log(): Log {
        if (!Log.INSTANCE) {
            Log.INSTANCE = new Log();
            Log.INSTANCE.init();
        }

        return Log.INSTANCE;
    }

    private static INSTANCE: Log;

    public constructor() {
        super({
            metadata: {
                project: "wise-hub",
                module: "daemon",
                environment: PortableEnv("WISE_ENVIRONMENT_TYPE"),
                service: "monitoring",
            },
            levelEnvs: ["WISE_LOG_LEVEL", "WISE_SUBPROJECT_LOG_LEVEL"],
        });
    }

    public init() {
        super.init();
    }
}
```

Across your project:

```typescript
Log.log().info("Info");
Log.log().infoGen(() => "costly log generation");
```

### Configuration

Format:

-   Configurable via `LOG_FORMAT` env. Available formats are: `json`, `json_pretty`, `oneline`. The default is oneline.

Level:

-   Configurable via envs specified in `level_envs` field of `super()` call. Universe-log chooses the most verbose level supplied. When no configurable envs are present, universe-log looks for `LOG_LEVEL` env. If it is also not present, a default `info` level is used.

# universe-log

Universal javascript log for node and browser. Suitable for libraries and microservices. Configurable via env and window. Extendable

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

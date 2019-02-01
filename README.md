# universe-log
Universal javascript log for node and browser. Suitable for libraries and microservices. Configurable via env and window. Extendable

### Install

```bash
$ npm install --save universe-log
```

### Use in your project (typescript)

Best practice to use universe-log is to create a singleton Log class in your project that extends AbstractUniverseLog.

```typescript
import { AbstractUniverseLog } from "universe-log";

export class Log extends AbstractUniverseLog {
    private static INSTANCE: Log;

    private constructor() {
        super("steem-wise-core");
    }

    public init() {
        super.init([process.env.WISE_CORE_LOG_LEVEL, process.env.WISE_LOG_LEVEL, "info"]);
    }

    public static log(): Log {
        if (!Log.INSTANCE) {
            Log.INSTANCE = new Log();
            Log.INSTANCE.init();
        }

        return Log.INSTANCE;
    }
}

```

Across your project:

```typescript
Log.log().info("Info");
Log.log().cheapDebug(() => "costly log generation");
```

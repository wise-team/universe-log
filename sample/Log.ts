import { AbstractUniverseLog, PortableEnv } from "../src/index";

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

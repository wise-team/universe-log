/* tslint:disable:no-console */
export class StaticConfig {
    public static LEAST_LEVEL_ENV = "LOG_LEVEL";
    public static LOG_FORMAT_ENV = "LOG_FORMAT";
    public static LOG_METADATA_ENV = "LOG_METADATA";
    public static REEVALUATE_CONFIG_AFTER_MS: number = 150;

    public static DEFAULT_LOG_FN: (msg: string) => void = (msg: string) => console.error(msg);
}

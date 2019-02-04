/* tslint:disable:no-console */
import ow from "ow";

import { LiveLogConfig } from "./config/LiveLogConfig";
import { LogLevel } from "./config/LogLevel";
import { LogMetadata } from "./config/LogMetadata";
import { ParseLogMsg } from "./parse/ParseLogMsg";

/**
 * Logging levels conforms NPM logging levels
 */
export abstract class AbstractUniverseLog {
    public static level = LogLevel;
    private metadata: LogMetadata = LogMetadata.EMPTY_METADATA;
    private liveConfig: LiveLogConfig;

    public constructor(props: { metadata?: LogMetadata; levelEnvs: string[] }) {
        if (props.metadata) {
            ow(props.metadata, "metadata", ow.object);
            this.metadata = props.metadata;
        }

        ow(props.levelEnvs, "levelEnvs", ow.object);
        this.liveConfig = new LiveLogConfig(props.levelEnvs);
    }

    public init(logLevelEnvs: Array<string | undefined>) {
        this.liveConfig.setLevelEvaluationEnvNames(logLevelEnvs);
    }

    public mutateMetadata(metadata: LogMetadata) {
        this.metadata = { ...this.metadata, ...metadata };
    }

    public getLevel(): string {
        return this.liveConfig.getLevel();
    }

    public isDebug() {
        const levelThreshold = LogLevel.LEVELS_VALUES[this.getLevel()];
        return levelThreshold >= LogLevel.LEVELS_VALUES.debug;
    }

    public error(msg: string) {
        this.doPlainOrEfficientLog(LogLevel.error, msg);
    }

    public warn(msg: string) {
        this.doPlainOrEfficientLog(LogLevel.warn, msg);
    }

    public info(msg: string) {
        this.doPlainOrEfficientLog(LogLevel.info, msg);
    }

    public http(msg: string) {
        this.doPlainOrEfficientLog(LogLevel.http, msg);
    }

    public verbose(msg: string) {
        this.doPlainOrEfficientLog(LogLevel.verbose, msg);
    }

    public debug(msg: string) {
        this.doPlainOrEfficientLog(LogLevel.debug, msg);
    }

    public silly(msg: string | (() => string)) {
        this.doPlainOrEfficientLog(LogLevel.silly, msg);
    }

    public doPlainOrEfficientLog(level: LogLevel, msg: string | (() => string)) {
        if (typeof msg === "function") {
            const msgGenerator = msg as (() => string);
            this.doEfficientLog(level, msgGenerator);
        } else {
            this.doPlainLog(level, msg);
        }
    }

    /**
     * Calls generator fn only if logging level is reached.
     */
    public doEfficientLog(level: LogLevel, msgGeneratorFn: () => string): void {
        const levelThreshold = LogLevel.LEVELS_VALUES[this.getLevel()];
        const msgLevel = LogLevel.LEVELS_VALUES[level];
        if (msgLevel <= levelThreshold) {
            this.doPlainLog(level, msgGeneratorFn());
        }
    }

    public doPlainLog(level: LogLevel, ...msgsObjs: any) {
        ParseLogMsg.parse(level, msgsObjs);
    }
}

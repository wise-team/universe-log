/* tslint:disable:no-console */
import ow from "ow";

import { LiveLogConfig } from "./config/LiveLogConfig";
import { LogLevel } from "./config/LogLevel";
import { LogMetadata } from "./config/LogMetadata";
import { StaticConfig } from "./config/StaticConfig";
import { ParseLogMsg } from "./parse/ParseLogMsg";
import { UniverseLog } from "./UniverseLog";

/**
 * Logging levels conforms NPM logging levels
 */
export abstract class AbstractUniverseLog implements UniverseLog {
    public static level = LogLevel;
    private instanceMetadata: LogMetadata = LogMetadata.EMPTY_METADATA;
    private liveConfig: LiveLogConfig;
    private logFn: (msg: string) => void;

    public constructor(props: AbstractUniverseLog.Properties) {
        if (props.metadata) {
            ow(props.metadata, "metadata", ow.object);
            this.instanceMetadata = props.metadata;
        }

        if (props.logFn) {
            this.logFn = props.logFn;
        } else {
            this.logFn = StaticConfig.DEFAULT_LOG_FN;
        }
        ow(this.logFn, "logFn", ow.function);

        ow(props.levelEnvs, "levelEnvs", ow.object);
        this.liveConfig = new LiveLogConfig(props.levelEnvs, (msg: string) => this.logFn(msg));
    }

    public init(logLevelEnvs?: string[]) {
        if (logLevelEnvs) {
            this.liveConfig.setLevelEvaluationEnvNames(logLevelEnvs);
        }
        this.reevaluateConfigIfRequired();
    }

    public getLevel(): LogLevel {
        return this.liveConfig.getLevel();
    }

    public getFormatName(): string {
        return this.liveConfig.getFormat().getName();
    }

    public getMetadata(): LogMetadata {
        return { ...this.instanceMetadata, ...this.liveConfig.getMetadata() };
    }

    public isDebug() {
        const levelThreshold = LogLevel.LEVELS_VALUES[this.getLevel()];
        return levelThreshold >= LogLevel.LEVELS_VALUES.debug;
    }

    public error(...msg: any[]) {
        this.doLog(LogLevel.error, msg);
    }

    public errorGen(genFn: () => any[]) {
        this.doEfficientLog(LogLevel.error, genFn);
    }

    public warn(...msg: any[]) {
        this.doLog(LogLevel.warn, msg);
    }

    public warnGen(genFn: () => any[]) {
        this.doEfficientLog(LogLevel.warn, genFn);
    }

    public info(...msg: any[]) {
        this.doLog(LogLevel.info, msg);
    }

    public infoGen(genFn: () => any[]) {
        this.doEfficientLog(LogLevel.info, genFn);
    }

    public http(...msg: any[]) {
        this.doLog(LogLevel.http, msg);
    }

    public httpGen(genFn: () => any[]) {
        this.doEfficientLog(LogLevel.http, genFn);
    }

    public verbose(...msg: any[]) {
        this.doLog(LogLevel.verbose, msg);
    }

    public verboseGen(genFn: () => any[]) {
        this.doEfficientLog(LogLevel.verbose, genFn);
    }

    public debug(...msg: any[]) {
        this.doLog(LogLevel.debug, msg);
    }

    public debugGen(genFn: () => any[]) {
        this.doEfficientLog(LogLevel.debug, genFn);
    }

    public silly(...msg: any[]) {
        this.doLog(LogLevel.silly, msg);
    }

    public sillyGen(genFn: () => any[]) {
        this.doEfficientLog(LogLevel.silly, genFn);
    }

    /**
     * Calls generator fn only if logging level is reached.
     */
    public doEfficientLog(level: LogLevel, msgGeneratorFn: () => any[]): void {
        this.reevaluateConfigIfRequired();

        const levelThreshold = LogLevel.LEVELS_VALUES[this.getLevel()];
        const msgLevel = LogLevel.LEVELS_VALUES[level];
        if (msgLevel <= levelThreshold) {
            this.doLog(level, msgGeneratorFn());
        }
    }

    public doLog(level: LogLevel, ...msgsObjs: any[]) {
        this.reevaluateConfigIfRequired();

        if (msgsObjs.length === 0) {
            return;
        }

        if (msgsObjs.length === 1 && Array.isArray(msgsObjs[0])) {
            msgsObjs = msgsObjs[0];
        }

        if (LogLevel.isLessOrEquallyVerbose({ level, threshold: this.getLevel() })) {
            const parsedMessage = ParseLogMsg.parse(level, msgsObjs);
            const formattedMessage = this.liveConfig.getFormat().format(parsedMessage, this.getMetadata());
            this.rawWriteToLog(formattedMessage);
        }
    }

    private rawWriteToLog(msg: string) {
        this.logFn(msg);
    }

    private reevaluateConfigIfRequired() {
        this.liveConfig.evaluateIfRequired();
    }
}

export namespace AbstractUniverseLog {
    export interface Properties {
        metadata?: LogMetadata;
        levelEnvs: string[];
        logFn?: (msg: string) => void;
    }
}

import { LogLevel } from "./config/LogLevel";
import { LogMetadata } from "./config/LogMetadata";

export interface UniverseLog {
    getLevel(): LogLevel;

    getFormatName(): string;

    getMetadata(): LogMetadata;

    isDebug(): boolean;

    error(...msg: any[]): void;

    errorGen(genFn: () => any[]): void;

    warn(...msg: any[]): void;

    warnGen(genFn: () => any[]): void;

    info(...msg: any[]): void;

    infoGen(genFn: () => any[]): void;

    http(...msg: any[]): void;

    httpGen(genFn: () => any[]): void;

    verbose(...msg: any[]): void;

    verboseGen(genFn: () => any[]): void;

    debug(...msg: any[]): void;

    debugGen(genFn: () => any[]): void;

    silly(...msg: any[]): void;

    sillyGen(genFn: () => any[]): void;

    /**
     * Calls generator fn only if logging level is reached.
     */
    doEfficientLog(level: LogLevel, msgGeneratorFn: () => any[]): void;

    doLog(level: LogLevel, ...msgsObjs: any[]): void;
}

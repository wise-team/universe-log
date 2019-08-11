/* tslint:disable:no-console */

import { LogLevel } from "./config/LogLevel";
import { LogMetadata } from "./config/LogMetadata";
import { LogEngine } from "./LogEngine";
import { Properties } from "./Properties";
import { UniverseLog } from "./UniverseLog";

/**
 * Logging levels conforms NPM logging levels
 */
export abstract class AbstractUniverseLog implements UniverseLog {
    private logEngine: LogEngine;

    public constructor(propsOrEngine: Properties | LogEngine) {
        if (propsOrEngine instanceof LogEngine) {
            this.logEngine = propsOrEngine;
        } else {
            this.logEngine = new LogEngine(propsOrEngine);
        }
    }

    public getLevel(): LogLevel {
        return this.logEngine.getLevel();
    }

    public getFormatName(): string {
        return this.logEngine.getFormatName();
    }

    public getMetadata(): LogMetadata {
        return this.logEngine.getMetadata();
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
        this.logEngine.doEfficientLog(level, msgGeneratorFn);
    }

    public doLog(level: LogLevel, ...msgsObjs: any[]) {
        this.logEngine.doLog(level, ...msgsObjs);
    }

    protected getEngine(): LogEngine {
        return this.logEngine;
    }
}

/* tslint:disable:no-console */

import { LiveLogConfig } from "./config/LiveLogConfig";
import { LogLevel } from "./config/LogLevel";
import { LogMetadata } from "./config/LogMetadata";
import { StaticConfig } from "./config/StaticConfig";
import { LogFormats } from "./format/LogFormats";
import { ParseLogMsg } from "./parse/ParseLogMsg";
import { Properties } from "./Properties";

/**
 * Logging levels conforms NPM logging levels
 */
export class LogEngine {
    protected instanceMetadata: LogMetadata = LogMetadata.EMPTY_METADATA;
    protected liveConfig: LiveLogConfig;
    protected logFn: (msg: string) => void;

    public constructor(props: Properties | { clone: LogEngine; newMetadata: LogMetadata }) {
        if ("clone" in props) {
            this.instanceMetadata = { ...props.clone.instanceMetadata, ...props.newMetadata };
            this.liveConfig = props.clone.liveConfig;
            this.logFn = props.clone.logFn;
            return;
        }

        Properties.validate(props);

        if (props.metadata) {
            this.instanceMetadata = props.metadata;
        }

        if (props.logFn) {
            this.logFn = props.logFn;
        } else {
            this.logFn = StaticConfig.DEFAULT_LOG_FN;
        }

        const defaultFormat = props.defaultFormat ? LogFormats.valueOf(props.defaultFormat) : LogFormats.DEFAULT_FORMAT;
        this.liveConfig = new LiveLogConfig({
            levelEvaluationEnvNames: props.levelEnvs || [],
            fallbackLog: this.logFn,
            defaultFormat,
        });
    }

    public cloneWithMetadata(newMetadata: LogMetadata): LogEngine {
        return new LogEngine({ clone: this, newMetadata });
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

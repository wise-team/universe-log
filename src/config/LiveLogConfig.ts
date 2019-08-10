import ow from "ow";

import { LogFormat } from "../format/LogFormat";
import { LogFormats } from "../format/LogFormats";
import { FallbackLog } from "../util/FallbackLog";

import { LogLevel } from "./LogLevel";
import { LogMetadata } from "./LogMetadata";
import { PortableEnv } from "./PortableEnv";
import { StaticConfig } from "./StaticConfig";

export class LiveLogConfig {
    private levelEvaluationEnvNames: string[] = [];
    private level: LogLevel = LogLevel.DEFAULT_LEVEL;
    private defaultFormat: LogFormat;
    private format: LogFormat;
    private metadata: LogMetadata = LogMetadata.EMPTY_METADATA;
    private fallbackLog: (msg: string) => void;
    private nextReevaluateTimestampMs: number = 0;

    public constructor(params: {
        levelEvaluationEnvNames: string[];
        fallbackLog: (msg: string) => void;
        defaultFormat: LogFormat;
    }) {
        this.levelEvaluationEnvNames = params.levelEvaluationEnvNames;
        ow(this.levelEvaluationEnvNames, "levelEvaluationEnvNames", ow.array.ofType(ow.string));

        this.fallbackLog = params.fallbackLog;
        ow(this.fallbackLog, "fallbackLog", ow.function);

        this.defaultFormat = params.defaultFormat;
        ow(this.defaultFormat, "defaultFormat", ow.object);
        this.format = this.defaultFormat;

        this.evaluateIfRequired();
    }

    public setLevelEvaluationEnvNames(levelEvaluationEnvNames: string[]) {
        this.levelEvaluationEnvNames = levelEvaluationEnvNames;
        this.evaluateIfRequired();
    }

    public getLevel(): LogLevel {
        return this.level;
    }

    public getFormat(): LogFormat {
        return this.format;
    }

    public getMetadata(): LogMetadata {
        return this.metadata;
    }

    public evaluateIfRequired() {
        if (Date.now() < this.nextReevaluateTimestampMs) {
            return;
        }

        try {
            this.nextReevaluateTimestampMs = Date.now() + StaticConfig.REEVALUATE_CONFIG_AFTER_MS;
            this.evaluate();
        } catch (error) {
            this.fallbackLog(`Could not evaluate live log config: ${error}: ${error.stack}`);
        }
    }

    private evaluate() {
        this.format = this.evaluateFormat();
        this.level = this.evaluateLogLevel();
        this.metadata = this.evaluateMetadata();
    }

    private evaluateFormat(): LogFormat {
        const formatStr = PortableEnv(StaticConfig.LOG_FORMAT_ENV);
        if (formatStr) {
            return LogFormats.valueOf(formatStr);
        } else {
            return LogFormats.DEFAULT_FORMAT;
        }
    }

    private evaluateLogLevel(): LogLevel {
        const primaryLevelEvaluation = this.chooseMostVerboseLevel(this.getEnvValues(this.levelEvaluationEnvNames));
        if (primaryLevelEvaluation) {
            return primaryLevelEvaluation;
        }

        const leastLevelEvaluation = this.chooseMostVerboseLevel(this.getEnvValues([StaticConfig.LEAST_LEVEL_ENV]));
        if (leastLevelEvaluation) {
            return leastLevelEvaluation;
        }

        return LogLevel.DEFAULT_LEVEL;
    }

    private getEnvValues(envNames: string[]): string[] {
        const envValuesOrUndefined = envNames.map(envName => PortableEnv(envName));
        return envValuesOrUndefined.filter(val => !!val).map(elem => elem || "unreachable");
    }

    private chooseMostVerboseLevel(levelList: string[]): LogLevel | undefined {
        const definedLevels: LogLevel[] = levelList.map(level => LogLevel.valueOf(level));

        if (definedLevels.length === 0) {
            return undefined;
        }

        const mostVerboseLevel: LogLevel = definedLevels.reduce((theMostVerboseLevel: LogLevel, currLevel: LogLevel) =>
            LogLevel.moreVerbose(theMostVerboseLevel, currLevel),
        );
        return mostVerboseLevel;
    }

    private evaluateMetadata(): LogMetadata {
        try {
            const metadataStr = PortableEnv(StaticConfig.LOG_METADATA_ENV);
            if (metadataStr) {
                return JSON.parse(metadataStr);
            }
        } catch (error) {
            FallbackLog.log(`Could not parse value of ${StaticConfig.LOG_METADATA_ENV} env: ${error}`);
        }
        return LogMetadata.EMPTY_METADATA;
    }
}

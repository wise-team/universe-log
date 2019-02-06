import ow from "ow";

import { LogFormat } from "../format/LogFormat";

import { LogLevel } from "./LogLevel";
import { PortableEnv } from "./PortableEnv";
import { StaticConfig } from "./StaticConfig";

export class LiveLogConfig {
    private levelEvaluationEnvNames: string[] = [];
    private level: LogLevel = LogLevel.DEFAULT_LEVEL;
    private format: LogFormat = LogFormat.DEFAULT_FORMAT;
    private fallbackLog: (msg: string) => void;
    private nextReevaluateTimestampMs: number = 0;

    public constructor(levelEvaluationEnvNames: string[], fallbackLog: (msg: string) => void) {
        this.levelEvaluationEnvNames = levelEvaluationEnvNames;
        ow(this.levelEvaluationEnvNames, "levelEvaluationEnvNames", ow.array.ofType(ow.string));

        this.fallbackLog = fallbackLog;
        ow(this.fallbackLog, "fallbackLog", ow.function);

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
    }

    private evaluateFormat(): LogFormat {
        const formatStr = PortableEnv(StaticConfig.LOG_FORMAT_ENV);
        if (formatStr) {
            return LogFormat.valueOf(formatStr);
        } else {
            return LogFormat.DEFAULT_FORMAT;
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
}

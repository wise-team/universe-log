import { LogMetadata } from "../config/LogMetadata";
import { UniverseLogError } from "../error/UniverseLogError";

import { JsonLogFormat } from "./JsonLogFormat";
import { LogMessage } from "./LogMessage";
import { OnelineLogFormat } from "./OnelineLogFormat";

export interface LogFormat {
    format: (msg: LogMessage, metadata: LogMetadata) => string;
    getName(): string;
}

export namespace LogFormat {
    export const FORMATS: { json: LogFormat; json_pretty: LogFormat; oneline: LogFormat } = {
        json: new JsonLogFormat(false),
        json_pretty: new JsonLogFormat(true),
        oneline: new OnelineLogFormat(),
    };

    export const DEFAULT_FORMAT = FORMATS.oneline;

    export function valueOf(name: string): LogFormat {
        if (typeof (FORMATS as any)[name] === "undefined") {
            const availableLevels = Object.keys(FORMATS).join(",");
            throw new UniverseLogError(
                `There is no such log format: '${name}'. Available formats: [ ${availableLevels} ]`,
            );
        }
        return (FORMATS as any)[name];
    }
}

import { UniverseLogError } from "../error/UniverseLogError";

import { JsonLogFormat } from "./formats/JsonLogFormat";
import { OnelineLogFormat } from "./formats/OnelineLogFormat";
import { LogFormat } from "./LogFormat";

export namespace LogFormats {
    interface Formats {
        json: LogFormat;
        json_pretty: LogFormat;
        oneline: LogFormat;
    }
    export type Format = keyof Formats;

    export const FORMATS: Formats = {
        json: new JsonLogFormat(false),
        json_pretty: new JsonLogFormat(true),
        oneline: new OnelineLogFormat(),
    };

    export const KEYS: { [x in Format]: Format } = Object.freeze({
        json: "json",
        json_pretty: "json_pretty",
        oneline: "oneline",
    });

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

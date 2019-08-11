import ow, { BasePredicate } from "ow";

import { LogMetadata } from "./config/LogMetadata";
import { LogFormats } from "./format/LogFormats";

export interface Properties {
    levelEnvs?: string[];
    metadata?: LogMetadata;
    logFn?: (msg: string) => void;
    defaultFormat?: LogFormats.Format;
}

export namespace Properties {
    export function validate(p: Properties) {
        ow(p.levelEnvs, "Properties.levelEnvs", ow.any(ow.undefined, ow.array.ofType(ow.string)));
        ow(p.metadata, "Properties.metadata", ow.optional.object);
        ow(p.logFn, "Properties.logFn", ow.any(ow.undefined, ow.function));
        ow(p.defaultFormat, "Properties.defaultFormat", ow.optional.string.oneOf(
            Object.keys(LogFormats.KEYS),
        ) as BasePredicate<any>);
    }
}

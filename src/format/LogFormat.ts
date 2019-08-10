import { LogMetadata } from "../config/LogMetadata";

import { LogMessage } from "./LogMessage";

export interface LogFormat {
    format: (msg: LogMessage, metadata: LogMetadata) => string;
    getName(): string;
}

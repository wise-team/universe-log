import { LogMetadata } from "../LogMetadata";
import { TimeUtils } from "../util/TimeUtils";

import { LogMessage } from "./LogMessage";

export class OnelineLogFormat {
    public format(msg: LogMessage, metadata: LogMetadata): string {
        const time = msg.timestamp || msg.time || TimeUtils.getUTCISOTime();
        const name = LogMetadata.getBestIdentifier(metadata);
        return `${name} | ${time} [${msg.level}]: ${msg.message}`;
    }
}

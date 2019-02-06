import { LogMetadata } from "../config/LogMetadata";
import { TimeUtils } from "../util/TimeUtils";

import { LogMessage } from "./LogMessage";

export class OnelineLogFormat {
    public static FORMAT_NAME = "oneline";

    public format(msg: LogMessage, metadata: LogMetadata): string {
        const time = msg.time_iso || new Date(msg.timestamp).toISOString() || TimeUtils.getUTCISOTime();
        const name = LogMetadata.getBestIdentifier(metadata);
        return `${name} | ${time} [${msg.level}]: ${msg.message}`;
    }

    public getName(): string {
        return OnelineLogFormat.FORMAT_NAME;
    }
}

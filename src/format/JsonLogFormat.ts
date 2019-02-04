import { LogMetadata } from "../config/LogMetadata";
import { TimeUtils } from "../util/TimeUtils";

import { LogMessage } from "./LogMessage";

export class JsonLogFormat {
    private pretty: boolean = false;

    public constructor(pretty: boolean) {
        this.pretty = pretty;
    }

    public format(msg: LogMessage, metadata: LogMetadata): string {
        const logMsgObj = {
            time: TimeUtils.getUTCISOTime(),
            timestamp: TimeUtils.getTimestamp(),
            ...metadata,
            ...msg,
        };

        if (this.pretty) {
            return JSON.stringify(logMsgObj, undefined, 2);
        } else {
            return JSON.stringify(logMsgObj);
        }
    }
}

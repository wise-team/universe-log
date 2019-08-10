import { LogMetadata } from "../../config/LogMetadata";
import { LogMessage } from "../LogMessage";

export class JsonLogFormat {
    public static FORMAT_NAME = "json";
    public static FORMAT_NAME_PRETTY = "json_pretty";

    private pretty: boolean = false;

    public constructor(pretty: boolean) {
        this.pretty = pretty;
    }

    public format(msg: LogMessage, metadata: LogMetadata): string {
        const logMsgObj = {
            ...metadata,
            ...msg,
        };

        if (this.pretty) {
            return JSON.stringify(logMsgObj, undefined, 2) + "\n"; // each message is split by an empty line
        } else {
            return JSON.stringify(logMsgObj);
        }
    }

    public getName(): string {
        return this.pretty ? JsonLogFormat.FORMAT_NAME_PRETTY : JsonLogFormat.FORMAT_NAME;
    }
}

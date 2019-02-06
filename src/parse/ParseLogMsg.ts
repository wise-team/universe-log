import { LogLevel } from "../config/LogLevel";
import { LogMessage } from "../format/LogMessage";
import { TimeUtils } from "../util/TimeUtils";

export class ParseLogMsg {
    public static parse(level: LogLevel, elems: any[]): LogMessage {
        let outObject = ParseLogMsg.basicLogMsg(level);
        for (const elem of elems) {
            outObject = {
                ...outObject,
                ...ParseLogMsg.parseElem(elem, outObject),
            };
        }
        return outObject as LogMessage;
    }

    private static basicLogMsg(level: LogLevel) {
        return {
            time_iso: TimeUtils.getUTCISOTime(),
            timestamp: TimeUtils.getTimestamp(),
            level,
            level_value: LogLevel.LEVELS_VALUES[level],
        };
    }

    private static parseElem(msgElem: any, outObj: any) {
        if (typeof msgElem === "string") {
            return ParseLogMsg.parseString(msgElem as string, outObj);
        } else if (msgElem instanceof Error) {
            return ParseLogMsg.parseError(msgElem as Error, outObj);
        } else if (typeof msgElem === "object") {
            return ParseLogMsg.parseObject(msgElem as object, outObj);
        } else {
            return ParseLogMsg.parseOther(msgElem, outObj);
        }
    }

    private static parseString(msg: string, outObj: any): object {
        return { message: (outObj.message ? outObj.message + "; " : "") + msg };
    }

    private static parseError(error: Error, outObj: any): object {
        const out: any = {};
        out.message = (outObj.message ? outObj.message + "; " : "") + (error + "").trim();

        if (outObj.error) {
            out.other_errors = [...(outObj.other_errors || [])];
            out.other_errors.push(ParseLogMsg.errorToObj(error));
        } else {
            out.error = ParseLogMsg.errorToObj(error);
        }
        return out;
    }

    private static errorToObj(error: Error) {
        return { name: error.name, message: error.message, stack: error.stack };
    }

    private static parseObject(msg: object, outObj: any): object {
        return { ...msg };
    }

    private static parseOther(msg: object, outObj: any): object {
        return { others: [...(outObj.others || []), msg] };
    }
}

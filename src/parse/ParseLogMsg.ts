import { LogMessage } from "../format/LogMessage";
import { LogLevel } from "../LogLevel";
import { TimeUtils } from "../util/TimeUtils";

export class ParseLogMsg {
    public static parse(level: LogLevel, ...msgObjs: any): LogMessage {
        let outObject = ParseLogMsg.basicLogMsg(level);
        for (const msgObj of msgObjs) {
            outObject = { ...outObject, ...ParseLogMsg.parseElem(msgObjs, outObject) };
        }
        return outObject as LogMessage;
    }

    private static basicLogMsg(level: LogLevel) {
        return {
            time: TimeUtils.getUTCISOTime(),
            timestamp: TimeUtils.getTimestamp(),
            level,
            level_num: LogLevel.LEVELS_VALUES[level],
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
        return { message: (outObj.message || "") + msg };
    }

    private static parseError(error: Error, outObj: any): object {
        const out: any = {};
        if (!outObj.message) {
            out.message = error + "";
        }

        if (out.error) {
            if (!out.other_errors) {
                out.other_errors = [];
            }
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

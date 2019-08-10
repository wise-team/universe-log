import { AbstractUniverseLog } from "./AbstractUniverseLog";
import { LogMetadata } from "./config/LogMetadata";

export class LogMock extends AbstractUniverseLog {
    public constructor(props: { metadata?: LogMetadata; levelEnvs: string[]; logFn: (msg: string) => void }) {
        super({
            ...props,
            logFn: (msg: string) => props.logFn(msg),
        });
    }
}

export function prepare(props: AbstractUniverseLog.Properties) {
    const output: { str: string } = { str: "" };
    const log = new LogMock({
        ...props,
        logFn: (msg: string) => {
            output.str += msg + "\n";
        },
    });
    return { log, output };
}

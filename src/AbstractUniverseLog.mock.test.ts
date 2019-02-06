import { AbstractUniverseLog } from "./AbstractUniverseLog";
import { LogMetadata } from "./config/LogMetadata";

export class LogMock extends AbstractUniverseLog {
    public constructor(props: { metadata?: LogMetadata; levelEnvs: string[]; logFn: (msg: string) => void }) {
        super({
            ...props,
            logFn: (msg: string) => props.logFn(msg),
        });
    }

    public init(levelEnvs: string[]) {
        super.init(levelEnvs);
    }
}

export function prepare(props: { metadata?: LogMetadata; levelEnvs: string[] }) {
    const output: { str: string } = { str: "" };
    const log = new LogMock({
        ...props,
        logFn: (msg: string) => {
            output.str += msg + "\n";
        },
    });
    return { log, output };
}

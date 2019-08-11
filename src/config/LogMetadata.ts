export interface LogMetadata {
    tag?: string;
    project?: string;
    environment?: string;
    service?: string;
    module?: string;
    library?: string;
    [x: string]: any;
}

export namespace LogMetadata {
    export const EMPTY_METADATA: LogMetadata = {};

    export function getBestIdentifier(metadata: LogMetadata): string {
        let ident = metadata.service ? `${metadata.service}.` : metadata.project ? `${metadata.project}.` : "";
        ident += metadata.module ? `${metadata.module}.` : "";
        ident += metadata.library ? `[${metadata.library}].` : "";
        ident += metadata.tag || "";
        if (!ident) ident = "universe-log-empty-id";
        return ident;
    }
}

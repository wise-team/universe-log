export interface LogMessage {
    time_iso: string;
    timestamp: number;
    message: string;
    level: string;
    level_value: number;
    [x: string]: any;
}

export interface LogMessage {
    time: string;
    timestamp: number;
    message: string;
    level: string;
    level_num: number;
    [x: string]: any;
}

export class TimeUtils {
    public static getTimestamp(): number {
        return Date.now();
    }

    public static getUTCISOTime(): string {
        return new Date().toISOString();
    }
}

/* tslint:disable:max-classes-per-file */
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import ChainedError from "typescript-chained-error";
import * as uuid from "uuid/v4";

import { LogLevel } from "../config/LogLevel";

import { ParseLogMsg } from "./ParseLogMsg";

chaiUse(chaiAsPromised);

describe("ParseLogMsg.parse()", () => {
    it("level becomes level field which contains string representation", () => {
        const level: LogLevel = _.sample(Object.keys(LogLevel.LEVELS_BY_NAME)) as LogLevel;
        const out = ParseLogMsg.parse(level, ["something"]);
        expect(out.level).to.be.equal(level);
    });

    it("level_value contains numeric representation (npm levels) of log level", () => {
        const level: LogLevel = _.sample(Object.keys(LogLevel.LEVELS_BY_NAME)) as LogLevel;
        const out = ParseLogMsg.parse(level, ["something"]);
        expect(out.level_value).to.be.equal(LogLevel.LEVELS_VALUES[level]);
    });

    it("time_iso contains ISO time", () => {
        const out = ParseLogMsg.parse(LogLevel.LEVELS_BY_NAME.debug, ["something"]);
        expect(out.time_iso).to.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/);
    });

    it("timestamp contains timestamp in millisecond format", () => {
        const out = ParseLogMsg.parse(LogLevel.LEVELS_BY_NAME.debug, ["something"]);
        expect(out.timestamp).to.be.approximately(Date.now(), 50);
    });

    it("all plain strings become the message field", () => {
        const msgelems = ["something", "in the", "rain"];
        const out = ParseLogMsg.parse(LogLevel.LEVELS_BY_NAME.debug, msgelems);
        for (const elem of msgelems) {
            expect(out.message).to.contain(elem);
        }
    });

    it("error names and messages join plain strings to become the message field", () => {
        const sampleError = new Error(`err-${uuid()}`);
        const msgelems = ["something", sampleError, "rain"];
        const out = ParseLogMsg.parse(LogLevel.LEVELS_BY_NAME.debug, msgelems);
        expect(out.message).to.contain(msgelems[0]);
        expect(out.message).to.contain(msgelems[2]);
        expect(out.message).to.contain(`${sampleError}`);
    });

    it("first error becomes the error field with subfields of name, message and stack", () => {
        const firstError = new Error(`err-1-${uuid()}`);
        const secondError = new Error(`err-2-${uuid()}`);
        const thirdError = new Error(`err-3-${uuid()}`);
        const msgelems = [firstError, secondError, thirdError];

        const out = ParseLogMsg.parse(LogLevel.LEVELS_BY_NAME.debug, msgelems);

        expect(out.error.name, "first error").to.be.equal(firstError.name);
        expect(out.error.message).to.be.equal(firstError.message);
        expect(out.error.stack).to.be.equal(firstError.stack);
    });

    it("second and next errors become other_errors field", () => {
        const firstError = new Error(`err-1-${uuid()}`);
        const secondError = new Error(`err-2-${uuid()}`);
        const thirdError = new Error(`err-3-${uuid()}`);
        const msgelems = [firstError, secondError, thirdError];

        const out = ParseLogMsg.parse(LogLevel.LEVELS_BY_NAME.debug, msgelems);

        expect(out.other_errors[0].message).to.be.equal(secondError.message);
        expect(out.other_errors[1].message).to.be.equal(thirdError.message);
    });

    it("supports nested causes", () => {
        class CustomErrorA extends ChainedError {
            public constructor(message?: string, cause?: Error) {
                super(message, cause);
            }
        }
        class CustomErrorB extends ChainedError {
            public constructor(message?: string, cause?: Error) {
                super(message, cause);
            }
        }
        class CustomErrorC extends ChainedError {
            public constructor(message?: string, cause?: Error) {
                super(message, cause);
            }
        }

        const err = new CustomErrorC("error_c", new CustomErrorB("error_b", new CustomErrorA("error_a")));

        const out = ParseLogMsg.parse(LogLevel.LEVELS_BY_NAME.debug, [err]);

        expect(out.error.message).to.be.equal("error_c");
        expect(out.error.cause.message).to.be.equal("error_b");
        expect(out.error.cause.cause.message).to.be.equal("error_a");
    });
});

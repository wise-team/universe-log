/* tslint:disable:max-classes-per-file */
import * as BluebirdPromise from "bluebird";
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as sinon from "sinon";
import * as uuid from "uuid/v4";

import { prepare } from "./AbstractUniverseLog.mock.test";
import { LogLevel } from "./config/LogLevel";
import { LogFormats } from "./format/LogFormats";
chaiUse(chaiAsPromised);

describe("AbstractUniverseLog", () => {
    beforeEach(() => {
        process.env = {};
    });

    it("Initializes with no error", async () => {
        const { log, output } = prepare({ levelEnvs: [] });
        log.getMetadata();
        expect(output.str).to.be.equal("");
    });

    it("When LOG_FORMAT env is not present, sets formatter to defaultFormat specified by params", async () => {
        for (const formattag of Object.keys(LogFormats.FORMATS)) {
            process.env.LOG_FORMAT = undefined;
            const { log } = prepare({ levelEnvs: [], defaultFormat: formattag as any });
            expect(log.getFormatName()).to.be.equal(formattag);
        }
    });

    it("Immediatelly sets formatter via LOG_FORMAT env", async () => {
        for (const formattag of Object.keys(LogFormats.FORMATS)) {
            process.env.LOG_FORMAT = formattag;
            const { log } = prepare({ levelEnvs: [] });
            expect(log.getFormatName()).to.be.equal(formattag);
        }
    });

    it("Sets formatter via LOG_FORMAT env when configuration changes", async () => {
        process.env.LOG_FORMAT = "json";
        const { log } = prepare({ levelEnvs: [] });
        await BluebirdPromise.delay(50);
        process.env.LOG_FORMAT = "json_pretty";
        await BluebirdPromise.delay(200);
        log.silly("Sth");
        expect(log.getFormatName()).to.be.equal("json_pretty");
    });

    it("Does not throw error, but logs when invalid format is supplied", async () => {
        process.env.LOG_FORMAT = `nonexistentformat${uuid()}`;
        const { output } = prepare({ levelEnvs: [] });
        expect(output.str).to.contain("There is no such log format");
        process.env.LOG_FORMAT = "json";
    });

    it("Immediatelly sets level via LOG_LEVEL env", async () => {
        for (const level of Object.keys(LogLevel.LEVELS_BY_NAME)) {
            process.env.LOG_LEVEL = level;
            const { log, output } = prepare({ levelEnvs: [] });
            expect(log.getLevel()).to.be.equal(level);
            expect(output.str).to.be.equal("");
        }
    });

    it("Sets level via LOG_LEVEL env when configuration changes", async () => {
        process.env.LOG_LEVEL = LogLevel.debug;
        const { log } = prepare({ levelEnvs: [] });
        expect(log.getLevel()).to.be.equal(LogLevel.debug);
        await BluebirdPromise.delay(10);
        process.env.LOG_LEVEL = LogLevel.error;
        await BluebirdPromise.delay(200);
        log.silly("Sth");
        expect(log.getLevel()).to.be.equal(LogLevel.error);
    });

    it("LOG_LEVEL is preferred only when no others envs are present", async () => {
        process.env.LOG_LEVEL = LogLevel.debug;
        process.env.HIGHER_LEVEL_LOG_LEVEL = LogLevel.warn;
        const { log } = prepare({ levelEnvs: ["HIGHER_LEVEL_LOG_LEVEL"] });
        expect(log.getLevel()).to.be.equal(LogLevel.warn);
    });

    it("Amongst log level envs the most verbose one is chosen", async () => {
        process.env.LLENV1 = LogLevel.warn;
        process.env.LLENV2 = LogLevel.silly;
        process.env.LLENV3 = LogLevel.info;
        process.env.LLENV4 = LogLevel.error;
        const { log } = prepare({ levelEnvs: ["LLENV1", "LLENV2", "LLENV3", "LLENV4"] });
        expect(log.getLevel()).to.be.equal(LogLevel.silly);
    });

    describe("log metadata", () => {
        it("Immediatelly sets metadata via LOG_METADATA env", async () => {
            const sampleMetadata = { project: "wise-hub", module: `n-${uuid()}` };
            process.env.LOG_METADATA = JSON.stringify(sampleMetadata);
            const { log } = prepare({ levelEnvs: [] });

            expect(log.getMetadata())
                .to.have.haveOwnProperty("project")
                .that.is.equal(sampleMetadata.project);
            expect(log.getMetadata())
                .to.have.haveOwnProperty("module")
                .that.is.equal(sampleMetadata.module);
        });

        it("Sets metadata via LOG_METADATA env when configuration changes", async () => {
            const sampleMetadata = { module: `n1-${uuid()}` };
            process.env.LOG_METADATA = JSON.stringify(sampleMetadata);
            const { log } = prepare({ levelEnvs: [] });
            expect(log.getMetadata().module).to.be.equal(sampleMetadata.module);

            await BluebirdPromise.delay(10);
            const sampleMetadata2 = { module: `n2-${uuid()}` };
            process.env.LOG_METADATA = JSON.stringify(sampleMetadata2);
            await BluebirdPromise.delay(200);
            log.silly("Sth");
            expect(log.getMetadata().module).to.be.equal(sampleMetadata2.module);
        });

        it("Env metadata overrides instance metadata", async () => {
            const instanceMetadata = { module: `n_instance-${uuid()}`, instance_field: "instance_value" };
            const envMetadata = { module: `n_env-${uuid()}`, env_field: "env_value" };
            process.env.LOG_METADATA = JSON.stringify(envMetadata);

            const { log } = prepare({ levelEnvs: [], metadata: instanceMetadata });

            expect(log.getMetadata().module).to.be.equal(envMetadata.module);
            expect(log.getMetadata().instance_field).to.be.equal(instanceMetadata.instance_field);
            expect(log.getMetadata().env_field).to.be.equal(envMetadata.env_field);
        });

        it("Env metadata does not override tag", async () => {
            const instanceMetadata = { tag: "instance-tag" };
            const envMetadata = { tag: "env-tag" };
            process.env.LOG_METADATA = JSON.stringify(envMetadata);

            const { log } = prepare({ levelEnvs: [], metadata: instanceMetadata });

            expect(log.getMetadata().tag).to.be.equal(instanceMetadata.tag);
        });
    });

    describe("format: json", () => {
        beforeEach(() => {
            process.env.LOG_FORMAT = "json";
        });

        it("produces json", async () => {
            const { log, output } = prepare({ levelEnvs: [] });
            log.error("some message", new Error("with some error"));
            expect(output.str.trim())
                .to.be.a("string")
                .with.length.greaterThan(0);
            expect(() => JSON.parse(output.str)).to.not.throw();
        });

        it("error includes stack", async () => {
            const { log, output } = prepare({ levelEnvs: [] });
            log.error("some message", new Error("with some error"));
            const parsedMsg = JSON.parse(output.str);
            expect(parsedMsg.error).to.haveOwnProperty("stack");
        });

        it("each message is in separate line", async () => {
            const { log, output } = prepare({ levelEnvs: [] });
            log.error("some message", new Error("with some error"));
            log.warn("some message", new Error("with some error"));
            expect(output.str.trim().split("\n"))
                .to.be.an("array")
                .with.length(2);
        });

        it("attaches standard fields", async () => {
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            const errorMsg = `error_msg_${uuid()}`;
            const sampleError = new Error(`error-${uuid()}`);
            log.error(errorMsg, sampleError);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.contain(errorMsg);
            expect(logOutputParsed.error.name).to.be.equal(sampleError.name);
            expect(logOutputParsed.error.message).to.be.equal(sampleError.message);
            expect(logOutputParsed.error.stack).to.be.equal(sampleError.stack);
        });

        it("attaches custom fields", async () => {
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            const errorMsg = `error_msg_${uuid()}`;
            log.error(errorMsg, { custom_field: "custom_value" });

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.custom_field).to.be.equal("custom_value");
        });

        it("timestamp is attached to json log", async () => {
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            log.error("msg");

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.timestamp).to.be.approximately(Date.now(), 50);
        });
    });

    describe("format: json_pretty", () => {
        it("produces pretty json", async () => {
            process.env.LOG_FORMAT = "json_pretty";
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            log.error("msg");

            expect(output.str.trim()).to.contain("\n");
        });

        it("each message is split by empty line", async () => {
            process.env.LOG_FORMAT = "json_pretty";
            const { log, output } = prepare({ levelEnvs: [] });
            log.error("some message", new Error("with some error"));
            log.warn("some message", new Error("with some error"));
            expect(output.str.trim().split("\n\n"))
                .to.be.an("array")
                .with.length(2);
        });
    });

    describe("format: oneline", () => {
        beforeEach(() => {
            process.env.LOG_FORMAT = "oneline";
        });

        it("oneline produces single line log msgs", async () => {
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            log.error("msg");

            expect(output.str.trim()).to.not.contain("\n");
        });

        it("each message is in separate line", async () => {
            const { log, output } = prepare({ levelEnvs: [] });
            log.error("some message");
            log.warn("some message");
            expect(output.str.trim().split("\n"))
                .to.be.an("array")
                .with.length(2);
        });

        it("ISO time is attached to oneline log", async () => {
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            log.error("msg", new Error("hehe"));

            expect(output.str).to.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/);
        });

        it("prints error stack", async () => {
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            const errorWithStack = new Error("hehe");
            log.error("msg", errorWithStack);

            expect(output.str.trim()).to.contain(errorWithStack.stack);
        });
    });

    describe(".doLog()", () => {
        it("writes message to log", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            const errorMsg = `error_msg_${uuid()}`;
            log.doLog(LogLevel.error, errorMsg);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(errorMsg);
        });

        it("logs messages with level more verbose than threshold", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const msg = `_msg_${uuid()}`;
            log.doLog(LogLevel.warn, msg);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(msg);
        });

        it("logs messages with level of same verbosity than threshold", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const msg = `_msg_${uuid()}`;
            log.doLog(LogLevel.info, msg);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(msg);
        });

        it("does not log messages with level less verbose than threshold", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const msg = `_msg_${uuid()}`;
            log.doLog(LogLevel.http, msg);

            expect(output.str).to.be.equal("");
        });

        it("When error is present it does not override message", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const msg = `_msg_${uuid()}`;
            log.doLog(LogLevel.error, msg, new Error("some error"));

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.contain(msg);
        });
    });

    describe(".doEfficientLog()", () => {
        it("supports array of arguments", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const genFnSpy = sinon.fake.returns(["sample_msg", new Error("sample_error")]);
            log.doEfficientLog(LogLevel.error, genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.contain("sample_msg");
            expect(logOutputParsed.message).to.contain("sample_error");
        });

        it("supports single string as argument", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const genFnSpy = sinon.fake.returns("sample_msg");
            log.doEfficientLog(LogLevel.error, genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.contain("sample_msg");
        });

        it("supports single error as argument", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const genFnSpy = sinon.fake.returns([new Error("sample_error")]);
            log.doEfficientLog(LogLevel.error, genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.contain("sample_error");
            expect(logOutputParsed.error.message).to.be.equal("sample_error");
        });

        it("calls genFn() and logs messages with level more verbose than threshold", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const errorMsg = `error_msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(errorMsg);
            log.doEfficientLog(LogLevel.warn, genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(errorMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });

        it("calls genFn() and logs messages with level of same verbosity than threshold", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const errorMsg = `error_msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(errorMsg);
            log.doEfficientLog(LogLevel.info, genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(errorMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });

        it("does not call genFn() or log messages with level less verbose than threshold", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const errorMsg = `error_msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(errorMsg);
            log.doEfficientLog(LogLevel.debug, genFnSpy);

            expect(output.str).to.be.equal("");
            expect(genFnSpy.callCount).to.be.equal(0);
        });
    });

    describe(".error()", () => {
        it("writes message with error level", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "error";
            const { log, output } = prepare({ levelEnvs: [] });

            log.error("some message", new Error("with some error"));

            const logOutputParsed = JSON.parse(output.str);

            expect(logOutputParsed.level).to.be.equal("error");
        });
    });

    describe(".errorGen()", () => {
        it("calls genFn() when level is more verbose than error", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "error";
            const { log, output } = prepare({ levelEnvs: [] });

            const sampleMsg = `msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(sampleMsg);
            log.errorGen(genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(sampleMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });
    });

    describe(".warn()", () => {
        it("writes message with warn level", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "warn";
            const { log, output } = prepare({ levelEnvs: [] });

            log.warn("some message", new Error("with some error"));

            const logOutputParsed = JSON.parse(output.str);

            expect(logOutputParsed.level).to.be.equal(LogLevel.warn);
        });
    });

    describe(".warnGen()", () => {
        it("calls genFn() when level is more verbose than warn", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "warn";
            const { log, output } = prepare({ levelEnvs: [] });

            const sampleMsg = `msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(sampleMsg);
            log.warnGen(genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(sampleMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });
    });

    describe(".info()", () => {
        it("writes message with info level", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            log.info("some message", new Error("with some error"));

            const logOutputParsed = JSON.parse(output.str);

            expect(logOutputParsed.level).to.be.equal(LogLevel.info);
        });
    });

    describe(".infoGen()", () => {
        it("calls genFn() when level is more verbose than info", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "info";
            const { log, output } = prepare({ levelEnvs: [] });

            const sampleMsg = `msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(sampleMsg);
            log.infoGen(genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(sampleMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });
    });

    describe(".http()", () => {
        it("writes message with http level", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "http";
            const { log, output } = prepare({ levelEnvs: [] });

            log.http("some message", new Error("with some error"));

            const logOutputParsed = JSON.parse(output.str);

            expect(logOutputParsed.level).to.be.equal(LogLevel.http);
        });
    });

    describe(".httpGen()", () => {
        it("calls genFn() when level is more verbose than http", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "http";
            const { log, output } = prepare({ levelEnvs: [] });

            const sampleMsg = `msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(sampleMsg);
            log.httpGen(genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(sampleMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });
    });

    describe(".verbose()", () => {
        it("writes message with verbose level", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "verbose";
            const { log, output } = prepare({ levelEnvs: [] });

            log.verbose("some message", new Error("with some error"));

            const logOutputParsed = JSON.parse(output.str);

            expect(logOutputParsed.level).to.be.equal(LogLevel.verbose);
        });
    });

    describe(".verboseGen()", () => {
        it("calls genFn() when level is more verbose than verbose", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "verbose";
            const { log, output } = prepare({ levelEnvs: [] });

            const sampleMsg = `msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(sampleMsg);
            log.verboseGen(genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(sampleMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });
    });

    describe(".debug()", () => {
        it("writes message with debug level", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "debug";
            const { log, output } = prepare({ levelEnvs: [] });

            log.debug("some message", new Error("with some error"));

            const logOutputParsed = JSON.parse(output.str);

            expect(logOutputParsed.level).to.be.equal(LogLevel.debug);
        });
    });

    describe(".debugGen()", () => {
        it("calls genFn() when level is more verbose than debug", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "debug";
            const { log, output } = prepare({ levelEnvs: [] });

            const sampleMsg = `msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(sampleMsg);
            log.debugGen(genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(sampleMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });
    });

    describe(".silly()", () => {
        it("writes message with silly level", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            log.silly("some message", new Error("with some error"));

            const logOutputParsed = JSON.parse(output.str);

            expect(logOutputParsed.level).to.be.equal(LogLevel.silly);
        });
    });

    describe(".sillyGen()", () => {
        it("calls genFn() when level is more verbose than silly", async () => {
            process.env.LOG_FORMAT = "json";
            process.env.LOG_LEVEL = "silly";
            const { log, output } = prepare({ levelEnvs: [] });

            const sampleMsg = `msg_${uuid()}`;
            const genFnSpy = sinon.fake.returns(sampleMsg);
            log.sillyGen(genFnSpy);

            const logOutputParsed = JSON.parse(output.str);
            expect(logOutputParsed.message).to.be.equal(sampleMsg);
            expect(genFnSpy.callCount).to.be.equal(1);
        });
    });
});

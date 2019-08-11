/* tslint:disable:max-classes-per-file */
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { BasicTaggedUniverseLog } from "./BasicTaggedUniverseLog";
chaiUse(chaiAsPromised);

describe("BasicTaggedUniverseLog", () => {
    function mockLogFn() {
        const output: { str: string } = { str: "" };
        const logFn: (msg: string) => void = (msg: string) => {
            output.str += msg + "\n";
        };
        return { logFn, output };
    }

    it("tagged instance has different tag than parent", async () => {
        const { logFn, output } = mockLogFn();
        const root = new BasicTaggedUniverseLog({ metadata: { service: "service1", tag: "tag1" }, logFn });
        const child = root.tag("tag2");
        child.error("msg");

        expect(output.str).to.match(/service1/);
        expect(output.str).to.match(/tag2/);
        expect(output.str).to.not.match(/tag1/);
    });
});

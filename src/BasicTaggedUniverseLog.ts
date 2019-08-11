import { AbstractUniverseLog } from "./AbstractUniverseLog";
import { LogEngine } from "./LogEngine";
import { Properties } from "./Properties";
import { UniverseLog } from "./UniverseLog";

export class BasicTaggedUniverseLog extends AbstractUniverseLog implements UniverseLog {
    public constructor(propsOrEngine: Properties | LogEngine) {
        super(propsOrEngine);
    }

    public tag(tag: string): BasicTaggedUniverseLog {
        return new BasicTaggedUniverseLog(super.getEngine().cloneWithMetadata({ tag }));
    }
}

import { Logger, TLogLevelName } from "tslog";
import { AppConfig } from "./utils";

const log = (config: AppConfig) => new Logger({
    displayInstanceName: true,
    printLogMessageInNewLine: false,
    displayTypes: true,
    minLevel: config.log_level as TLogLevelName
});


export default log;
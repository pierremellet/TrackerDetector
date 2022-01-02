import { Logger } from "tslog";

const log = new Logger({
    displayInstanceName: true,
    printLogMessageInNewLine: false,
    displayTypes: true,
    minLevel: "debug"
});


export default log;
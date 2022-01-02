import app from './app';
import { Logger } from "tslog";
const log: Logger = new Logger({ name: "tracker-finder-server" });
const port = 3333;

log.info(`Start server on port ${port}`);

app.listen(port);
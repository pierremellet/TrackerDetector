import app from './app';
import { Logger } from "tslog";
const log: Logger = new Logger({ name: "tracker-finder-server" });

app.start(3000);

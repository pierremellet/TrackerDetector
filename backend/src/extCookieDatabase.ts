import { CronJob } from "cron";
import rootLogger from "./logger";
import axios from "axios";
import config from "./config";
import { parse, Options, CsvError } from 'csv-parse';

const _log = rootLogger(config).getChildLogger({
    name: "ExtCookieDatabaseService",
});


const headers = ['ID', 'Platform', 'Category', 'Cookie / Data Key name', 'Domain', 'Description', 'Retention period', 'Data Controller', 'User Privacy & GDPR Rights Portals', 'Wildcard match'];
var database: CookieInformation[] = [];


const findCookieInformationByName = async (cookieName: string): Promise<CookieInformation | undefined> => {
    return database.find(c => c["Cookie / Data Key name"] == cookieName);
}

const updateExtCookieDatabase = () => {

    const options: Options = {
        delimiter: ',',
        columns: headers
    };

    axios.get(config.cookieDatabaseURL).then(response => {
        parse(Buffer.from(response.data), options, (err: CsvError | undefined, res: any) => {
            if (err) {
                _log.error(err);
            }
            database = res as CookieInformation[];
            _log.debug(`Cookie information database is updated from ${config.cookieDatabaseURL}`);
        });
    })
}
updateExtCookieDatabase();
const job = new CronJob('*/5 * * * *', updateExtCookieDatabase);
job.start();

type CookieInformation = {
    ID: string,
    Platform: string,
    Category: string,
    'Cookie / Data Key name': string,
    Domain: string,
    Description: string,
    'Retention period': string,
    'Data Controller': string,
    'User Privacy & GDPR Rights Portals': string,
    'Wildcard match': string
}

export { findCookieInformationByName };
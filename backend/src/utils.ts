import { PartialReport } from "./model";

const extractHostname = (url: string) => {
  var hostname;

  if (url.indexOf("//") > -1) {
    hostname = url.split('/')[2];
  }
  else {
    hostname = url.split('/')[0];
  }

  hostname = hostname.split(':')[0];
  hostname = hostname.split('?')[0];

  return hostname;
}

class AppConfig {
  constructor(
    public port: number,
    public endpoint: string,
    public input_buffer: number,
    public log_level: string,
    public graphql_schema_dir: string,
    public cookieDatabaseURL: string
  ) { }

}

const b64reportToJSON = (b64: any): PartialReport => {
  const buffer = Buffer.from(b64, 'base64');
  const stringReport = buffer.toString('ascii');
  return JSON.parse(stringReport);
}

const removeURLParams = (report: PartialReport): PartialReport => {
  const paramStartPost = report.pageURL.indexOf("?");
  if (paramStartPost !== -1) {
    report.pageURL = report.pageURL.substring(0, paramStartPost);
  }
  return report;
}



export { extractHostname, AppConfig, b64reportToJSON, removeURLParams };
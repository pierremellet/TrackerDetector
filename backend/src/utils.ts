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
      public log_level: string
    ) { }
  
  }

export {extractHostname, AppConfig};
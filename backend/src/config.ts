import { AppConfig } from "./utils";
import yaml from 'js-yaml';
import fs from 'fs';

const config: AppConfig = yaml.load(fs.readFileSync('config/config.yml', 'utf8')) as AppConfig;


export default config;
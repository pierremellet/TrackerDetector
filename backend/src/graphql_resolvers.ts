import { Application, CookieInstance, PrismaClient } from "@prisma/client";
import { TrackerFinderController } from "./controller";
import { PubSub } from 'graphql-subscriptions';
import { AppConfig, extractHostname } from "./utils";
import * as fs from 'fs';
import topics from './topics';
import * as path from 'path';

export default class GraphqlAPI {

    public typeDefs: any[];
    public resolvers: any;

    constructor(protected config: AppConfig, protected pubsub: PubSub, protected prisma: PrismaClient, protected appController: TrackerFinderController) {

        this.typeDefs = importSchema(config.graphql_schema_dir);

        this.resolvers = {
            Mutation: {
                convertCookieInstanceToTemplate: async (_: any, params: any): Promise<any> => {
                    return await this.appController.convertCookieInstanceToTemplate(parseInt(params.versionId, 10), parseInt(params.cookieInstanceId, 10));
                },
                deleteCookieInstancesForVersion: async (_: any, params: any): Promise<any> => {
                    return await this.appController.deleteCookieInstancesForVersion(parseInt(params.versionId, 10));
                },
                updateApplication: async (_: any, params: any): Promise<any> => {
                    return await this.appController.updateApplication(parseInt(params.appId, 10), params.appName);
                },
                deleteApplication: async (_: any, params: any): Promise<Application> => {
                    return await this.appController.deleteApplication(parseInt(params.appId, 10));
                },
                updateApplicationVersion: async (_: any, params: any) => {
                    return await this.appController.updateApplicationVersion(params.version);
                },
                createApplicationVersion: async (_: any, params: any) => {
                    return await this.appController.createApplicationVersion(parseInt(params.appId, 10), params.versionName);
                },
                createPartialReport: (_: any, params: any) => {
                    const prms: Promise<CookieInstance>[] = [];
                    topics.rawPartialReportSubject.next(params.input);
                    return "ok";
                },
                createApplication: async (_: any, params: any) => {
                    return await this.appController.createApplication(params.appName);
                },
                linkApplicationURLToVersion: async (_:any, params:any) => {
                    return await this.appController.linkApplicationURLToVersion(parseInt(params.versionId, 10), parseInt(params.appURLId, 10))
                }
            },
            Query: {
                configuration: async (obj: any, args: any, context: any, info: any) => {
                    const urls = await this.prisma.application_Version.findMany({
                        select: {
                            urls: true
                        },
                        where: {
                            enable: true
                        }
                    }).then(version => version.map(v => v.urls.map(u => extractHostname(u.url))))
                    const flattendArray = urls.flat()
                    const deduplicated = [...new Set(flattendArray)];
                    return {
                        "domains": deduplicated
                    }
                },
                allApplications: (obj: any, args: any, context: any, info: any) => {
                    return prisma.application.findMany();
                },
                findApplication: (obj: any, args: any, context: any, info: any) => {
                    return prisma.application.findUnique({
                        where: {
                            id: args.id
                        }
                    })
                },
                allCookieTemplates: () => prisma.cookieTemplate.findMany(),
                allCookieInstances: () => prisma.cookieInstance.findMany(),
                allUnknowURLs: () => prisma.application_URL.findMany({
                    where : {
                        applicationVersionId : null
                    }
                })
            },
            ApplicationVersion: {
                report: async (appVersion: any, args: any) => {
                    const driftCookies = await this.prisma.cookieInstance.findMany({
                        where: {
                            applicationVersion: {
                                id: appVersion.id
                            }
                        }
                    })
                    return {
                        "driftCookies": driftCookies
                    };
                },
                urls: (appVersion: any) => prisma.application_URL.findMany({
                    where: {
                        applicationVersion: {
                            id: appVersion.id
                        }
                    }
                }),
                cookies: (appVersion: any) => prisma.cookieTemplate.findMany({
                    where: {
                        applicationVersion: {
                            id: appVersion.id
                        }
                    }
                })
            },
            Application: {
                versions: (application: any, args: any) => {
                    return this.prisma.application_Version.findMany({
                        where: {
                            id: args.filter,
                            application: {
                                id: application.id
                            }
                        }
                    })
                }
            },
            Subscription: {
                appCookieNotFounded: {
                    subscribe: (parent: any, args: any, context: any) => pubsub.asyncIterator(args.appId)
                }
            }
        };
    }



}

function importSchema(schemaFolder: string): string[] {
    const res: string[] = [];
    const dir = fs.readdirSync(schemaFolder);
    dir.forEach(file => {
        res.push(fs.readFileSync(path.join(schemaFolder, file), {
            encoding: 'utf-8'
        }))
    });
    return res;
}



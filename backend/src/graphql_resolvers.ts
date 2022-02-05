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

    constructor(protected config: AppConfig, protected pubsub: PubSub, protected prisma: PrismaClient, protected controller: TrackerFinderController) {

        this.typeDefs = importSchema(config.graphql_schema_dir);

        this.resolvers = {
            Mutation: {
                createDomain: async (_: any, params: any): Promise<any> => {
                    return await this.controller.createDomain(params.domainName);
                },
                updateDomain: async (_: any, params: any): Promise<any> => {
                    return await this.controller.updateDomain(parseInt(params.domainId, 10), params.domainName, params.domainEnable);
                },
                createCookieCategory: async (_: any, params: any): Promise<any> => {
                    return await this.controller.createCookieCategory(params.name);
                },
                updateCookieCategory: async (_: any, params: any): Promise<any> => {
                    return await this.controller.updateCookieCategory(parseInt(params.cookieCategoryId, 10), params.cookieCategoryName, params.cookieCategoryEnable);
                },
                convertCookieInstanceToTemplate: async (_: any, params: any): Promise<any> => {
                    return await this.controller.convertCookieInstanceToTemplate(parseInt(params.versionId, 10), parseInt(params.cookieCategoryId, 10), parseInt(params.cookieInstanceId, 10));
                },
                deleteCookieInstancesForVersion: async (_: any, params: any): Promise<any> => {
                    return await this.controller.deleteCookieInstancesForVersion(parseInt(params.versionId, 10));
                },
                updateApplication: async (_: any, params: any): Promise<any> => {
                    return await this.controller.applicationController.updateApplication(parseInt(params.appId, 10), params.appName);
                },
                deleteApplication: async (_: any, params: any): Promise<Application> => {
                    return await this.controller.applicationController.deleteApplication(parseInt(params.appId, 10));
                },
                updateApplicationVersion: async (_: any, params: any) => {
                    return await this.controller.updateApplicationVersion(params.version);
                },
                createApplicationVersion: async (_: any, params: any) => {
                    return await this.controller.createApplicationVersion(parseInt(params.appId, 10), params.versionName);
                },
                createPartialReport: (_: any, params: any) => {
                    topics.rawPartialReportSubject.next(params.input);
                    return "ok";
                },
                createApplication: async (_: any, params: any) => {
                    return await this.controller.applicationController.createApplication(params.appName);
                },
                linkUnknowURLToVersion: async (_: any, params: any) => {
                    return await this.controller.linkUnknowURLToVersion(parseInt(params.versionId, 10), parseInt(params.unknowURLId, 10))
                }
            },
            Query: {
                configuration: async (obj: any, args: any, context: any, info: any) => {
                    return {};
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
                allUnknowURLs: () => prisma.unknowURL.findMany()
            },
            Configuration: {
                domains: async (appVersion: any, args: any) => {
                    return this.prisma.domain.findMany({
                        orderBy : {
                            name : "asc"
                        }
                    });
                },
                cookieCategories: async (appVersion: any, args: any) => {
                    return this.prisma.cookieCategory.findMany({
                        orderBy: {
                            name : "asc"
                        }
                    });
                }
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
                    },
                    select:{
                        domain:true,
                        id:true,
                        path: true,
                        type: true,
                        created: true
                    }
                }),
                cookies: (appVersion: any) => prisma.cookieTemplate.findMany({
                    where: {
                        applicationVersion: {
                            id: appVersion.id
                        }
                    },
                    select : {
                        domain: true,
                        hostOnly: true,
                        id: true,
                        httpOnly: true,
                        secure: true,
                        session: true,
                        category: true,
                        nameRegex: true,
                        path: true
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



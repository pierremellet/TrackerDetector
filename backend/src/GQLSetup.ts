import { Application, CookieInstance, PrismaClient } from "@prisma/client";
import { TrackerFinderController } from "./controller";
import { PubSub } from 'graphql-subscriptions';
import { extractHostname } from "./utils";

export default class GQLSetup {

    public typeDefs: string;
    public resolvers: any;

    constructor(protected pubsub: PubSub, protected prisma: PrismaClient, protected appController: TrackerFinderController) {
        this.typeDefs = `
        type Configuration {
            domains: [String!]!
        }
        type Application {
            id: ID
            name: String
            versions(filter: Int): [ApplicationVersion!]
        }
        type ApplicationURL {
            id: ID
            url: String
        }
        type ApplicationVersion {
            id: ID
            name: String
            enable: Boolean
            urls: [ApplicationURL!]
            cookies: [CookieTemplate!]
        } 
        type CookieTemplate {   
            id: ID
            nameRegex : String
            httpOnly: Boolean
        }
        type CookieInstance {
            id: ID
            name: String
            domain: String
            path: String
            httpOnly: Boolean
            hostOnly: Boolean
            secure: Boolean
            session: Boolean
            timestamp: Int
        }
        input CookieTemplateInput {
            id: ID
            nameRegex: String
            domain: String
            path: String
            httpOnly: Boolean
            hostOnly: Boolean
            secure: Boolean
            session: Boolean
            disabled: Boolean
        }
        input CookieInstanceInput {
            id: ID
            name: String
            domain: String
            path: String
            httpOnly: Boolean
            hostOnly: Boolean
            secure: Boolean
            session: Boolean
            timetamp: Int
        }
        input URLInput{
            id: Int
            url: String
            disabled: Boolean
        } 
        input ApplicationVersionInput{
            id: Int
            name: String
            enable: Boolean
            urls: [URLInput!]
            cookies: [CookieTemplateInput!]
        }
        input PartialReport {
            url: String
            cookies: [CookieInstanceInput!]!
        }
        type Query {
            allApplications: [Application!]!
            findApplication(id: Int): Application
            allCookieTemplates: [CookieTemplate!]!
            allCookieInstances: [CookieInstance!]!
            configuration: Configuration
        }
        type Mutation {
            createPartialReport(input: PartialReport): String
            createApplication(appName: String): Application
            createApplicationVersion(appId: ID, versionName: String): ApplicationVersion
            updateApplication(appId: ID, appName: String): Application
            updateApplicationVersion(version: ApplicationVersionInput): ApplicationVersion
            deleteApplication(appId: ID):Application
        }
        type Subscription {
            appVerCookieNotFounded(appVersionId: ID): CookieInstance
        }
        `;

        this.resolvers = {
            Mutation: {
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
                    this.appController.rawPartialReportSubject.next(params.input);
                    return "ok";
                },
                createApplication: async (_: any, params: any) => {
                    return await this.appController.createApplication(params.appName);
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
                allCookieInstances: () => prisma.cookieInstance.findMany()
            },
            ApplicationVersion: {
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
                appVerCookieNotFounded: {
                    subscribe: (parent: any, args: any, context: any) => pubsub.asyncIterator("COOKIE_NOT_EXIST_" + args.appVersionId)
                }
            }
        };
    }



}
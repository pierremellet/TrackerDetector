import { CookieInstance, PrismaClient } from "@prisma/client";
import { makeExecutableSchema } from '@graphql-tools/schema';
import { TrackerFinderController } from "./controller";


export default class GraphQLController {

    public schema: any;

    constructor(protected prisma: PrismaClient, protected appController: TrackerFinderController) {
        const typeDefs = `
        type Application {
            id: ID
            name: String
            versions: [Application_Version!]
        }
        type Application_Version {
            id: ID
            name: String
            cookies: [CookieTemplate!]!
        }
        type Application_Version_Cookie {
            id: ID
            cookies: [CookieTemplate!]!
        }
        type CookieTemplate {
            id: ID
            nameRegex : String
            hostOnly: Boolean
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
        type Query {
            allApplications: [Application!]!
            findApplication(id: Int): Application
            allCookieTemplates: [CookieTemplate!]!
            allCookieInstances: [CookieInstance!]!
        }
        input CookieInput {
            name: String
            domain: String
            path: String
            httpOnly: Boolean
            hostOnly: Boolean
            secure: Boolean
            session: Boolean
            timestamp: Int
        }
        input PartialReport {
            url: String
            cookies: [CookieInput!]!
        }
        type Mutation {
            createPartialReport(input: PartialReport): String
            createApplication(appName: String): Application
            createApplicationVersion(appId: ID, versionName: String): Application
            createCookieTemplate(nameRegex: String): CookieTemplate
            associateCookieTemplateToApplicationVersion(versionId: ID, cookieId: ID): Application
            associateURLtoApplicationVersion(versionId: ID, URL: String): Application
        }
        `;
        const resolvers = {
            Mutation: {
                createApplicationVersion: async (_: any, params: any) => {
                    const res = await prisma.application_Version.create({
                        data: {
                            name: params.versionName,
                            application: {
                                connect: {
                                    id: parseInt(params.appId, 10)
                                }
                            }
                        }
                    });
                    return prisma.application.findFirst({
                        where: {
                            id: parseInt(params.appId, 10)
                        }
                    });
                },
                createPartialReport: (_: any, params: any) => {
                    const prms: Promise<CookieInstance>[] = [];
                    this.appController.rawPartialReportSubject.next(params.input);
                    return "ok";
                },
                associateCookieTemplateToApplicationVersion: (_: any, params: any) => {
                    return prisma.applicationVersion_Cookie.create({
                        data: {
                            applicationVersion: {
                                connect: {
                                    id: parseInt(params.versionId, 10)
                                }
                            },
                            cookieTemplate: {
                                connect: {
                                    id: parseInt(params.cookieId, 10)
                                }
                            }
                        }
                    })
                },
                createCookieTemplate: (_: any, params: any) => {
                    return prisma.cookieTemplate.create({
                        data: {
                            nameRegex: params.nameRegex,
                            domain: "",
                            hostOnly: true,
                            httpOnly: true,
                            path: "/",
                            secure: true,
                            session: true
                        }
                    })
                },
                createApplication: (_: any, params: any) => {
                    return prisma.application.create({
                        data: {
                            name: params.appName
                        }
                    })
                }
            },
            Query: {
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
            Application_Version: {
                cookies: (appVersion: any) => prisma.applicationVersion_Cookie.findMany({
                    where: {
                        applicationVersion: {
                            id: appVersion.id
                        },
                    },
                    include: {
                        cookieTemplate: true
                    }
                }).then(ct => ct.map(c => c.cookieTemplate))
            },
            Application: {
                versions: (application: any) => prisma.application_Version.findMany({
                    where: {
                        application: {
                            id: application.id
                        }
                    }
                })
            }
        }

        this.schema = makeExecutableSchema({
            resolvers,
            typeDefs,
        });
    }


}
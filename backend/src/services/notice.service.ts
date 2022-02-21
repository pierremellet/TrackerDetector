import PDFDocument = require('pdfkit');
import db from "../database";


const generateNotice = async (versionId: number, res: any) => {

    const version = await db.application_Version.findFirst({
        where: {
            id: versionId
        },
        include: {
            application: true,
            cookieTemplates: {
                include: {
                    category: true
                }
            },
        }
    })

    const doc = new PDFDocument({ bufferPages: true });
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {

        const pdfData = Buffer.concat(buffers);
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(pdfData),
            'Content-Type': 'application/pdf'
        })
            .end(pdfData);

    });

    doc.fontSize(20).text(`Application : ${version?.application.name}\n\n`);
    version?.cookieTemplates.forEach(ct => {
        doc.fontSize(14).text(`${ct.nameRegex}\n`)
        doc.fontSize(10).list([
            `Description : ${ct.description}`,
            `Domain : ${ct.domain}`,
            `Expiration : ${ct.expiration}`,
            `Category : ${ct.category.name}`,
        ])
        doc.fontSize(14).text(`\n\n`)
    });
    doc.end();
}

export { generateNotice }
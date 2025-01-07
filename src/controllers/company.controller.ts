import { Response, Request } from "express";
import mongoose from "mongoose";
import excelJs from "exceljs";

import companyModel from "../models/company.model";
import catchAsync from "../utils/errorHandling/catchAsync.utils";
import ExpressResponse from "../libs/express/response.libs";
import MailService from "../utils/mailService.utils";

import { companyDetailsType } from "../interfaces/models/companyDetails.types";
import { addCompanyType } from "../validations/company";

class companyController {
  public feedCompanyFromExcelToDB = catchAsync(
    async (req: Request, res: Response) => {
      if (!req.files || !req.files.length)
        return ExpressResponse.badRequest(res, "No file uploaded");

      const file = req.files as Express.Multer.File[];

      const companyExcels = file.filter((f) => f.fieldname === "companyExcel");

      if (!companyExcels.length)
        return ExpressResponse.badRequest(res, "No company excel uploaded");

      const companies: companyDetailsType[] = [];

      for (const companyExcel of companyExcels) {
        if (!companyExcel.buffer) continue;

        const workbook = new excelJs.Workbook();
        const nodeBuffer: excelJs.Buffer = Buffer.from(companyExcel.buffer);
        await workbook.xlsx.load(nodeBuffer);

        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) continue;

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const company = {
            companyName: row.getCell(6).isHyperlink
              ? (row.getCell(6).value as any)?.text?.richText[0]?.text
              : row.getCell(6).text,
            email: row.getCell(4).text as string,
            name: row.getCell(3).text as string,
            designation: row.getCell(5).text as string,
          };

          companies.push(company);
        });
      }

      await companyModel.insertMany(companies);

      ExpressResponse.success(res, "File uploaded", {
        companies,
        length: companies.length,
      });
    }
  );

  public getExcelTemplate = catchAsync(async (req: Request, res: Response) => {
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("Companies");

    worksheet.columns = [
      {},
      { header: "S no", key: "sno" },
      { header: "Name", key: "Name" },
      { header: "Designation", key: "Designation" },
      { header: "Company Email", key: "email" },
      { header: "Company Name", key: "companyName" },
    ];

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=company-template.xlsx"
    );

    res.end(buffer);
  });

  public getCompanies = catchAsync(async (req: Request, res: Response) => {
    // const { page = 0, limit = 0, search = "" } = req.query;
    const page = parseInt(req.query.page as string) as number;
    const limit = parseInt(req.query.limit as string) as number;
    const search = req.query.search as string;

    const companies = await companyModel
      .find({
        $or: [
          { companyName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { designation: { $regex: search, $options: "i" } },
        ],
      })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalCompanies = await companyModel.countDocuments({
      $or: [
        { companyName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
      ],
    });

    ExpressResponse.success(res, "Companies fetched", {
      data: companies,
      total: totalCompanies,
    });
  });

  public addCompany = catchAsync(async (req: Request, res: Response) => {
    const company = req.body as addCompanyType;

    await companyModel.create(company);

    ExpressResponse.accepted(res, "Company added");
  });

  public deleteCompany = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) return ExpressResponse.badRequest(res, "Id is required");
    if (mongoose.Types.ObjectId.isValid(id) === false)
      return ExpressResponse.badRequest(res, "Invalid id");
    await companyModel.findByIdAndDelete(id);

    ExpressResponse.accepted(res, "Company deleted");
  });

  public sendBulkMail = catchAsync(async (req: Request, res: Response) => {
    const pendingCompanies = await companyModel.find({ isSent: false });
    const mailService = new MailService();

    // for (const company of pendingCompanies) {
    //   await mailService.sendMail(
    //     company.email,
    //     "Test mail",
    //     `Hello ${company.name}, This is a test mail`
    //   );

    //   await companyModel.findByIdAndUpdate(company._id, {
    //     isSent: true,
    //     sendDate: new Date(),
    //   });
    // }

    const result = await mailService.sendMail(
      "niklausmike0987@gmail.com",
      "Passionate Software Developer Eager to Contribute",
      "<p>king</p>"
    );

    ExpressResponse.success(res, "Mail sent", result);
  });
}

export default new companyController();

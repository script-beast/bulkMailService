import { Response, Request } from "express";

import companyDetailsModel from "../models/companyDetails.model";
import catchAsync from "../utils/errorHandling/catchAsync.utils";
import ExpressResponse from "../libs/express/response.libs";

import excelJs from "exceljs";
import { companyDetailsType } from "interfaces/models/companyDetails.types";
import { addCompanyType } from "validations/company";
import mongoose from "mongoose";

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

      await companyDetailsModel.insertMany(companies);

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

    const companies = await companyDetailsModel
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

    const totalCompanies = await companyDetailsModel.countDocuments({
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

    await companyDetailsModel.create(company);

    ExpressResponse.accepted(res, "Company added");
  });

  public deleteCompany = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) return ExpressResponse.badRequest(res, "Id is required");
    if (mongoose.Types.ObjectId.isValid(id) === false)
      return ExpressResponse.badRequest(res, "Invalid id");
    await companyDetailsModel.findByIdAndDelete(id);

    ExpressResponse.accepted(res, "Company deleted");
  });
}

export default new companyController();

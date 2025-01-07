import express from "express";

import companyController from "../controllers/company.controller";

import validate from "../middlewares/validation.zod";

import addCompany from "../validations/company/addCompany.zod";

const router = express.Router();

router.post(
  "/feed-company-from-excel-to-db",
  companyController.feedCompanyFromExcelToDB
);

router.get("/get-excel-template", companyController.getExcelTemplate);

router.post("/", validate(addCompany), companyController.addCompany);

router.get("/", companyController.getCompanies);

router.delete("/:id", companyController.deleteCompany);

router.get("/send-bulk-email", companyController.sendBulkMail);

export default router;

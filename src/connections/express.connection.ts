import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";

import ExpressError from "../libs/express/error.libs";
import ExpressErrorMiddleWare from "../middlewares/errorHandle.error";

import companyRoutes from "../routes/company.routes";

export default class ExpressConnection {
  private app: Application;
  private upload: multer.Multer;

  constructor() {
    this.app = express();
    this.upload = multer();
    this.middlewares();
    this.routes();
  }

  private middlewares() {
    this.app.use(cors());
    this.app.use(bodyParser.json({ limit: "30mb" }));
    this.app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
    // want to have any name of the file, so we are using single
    this.app.use(this.upload.any());
  }

  private routes() {
    this.app.get("/test", (req: Request, res: Response, next: NextFunction) => {
      res.json({ message: "Hello World" });
    });
    this.app.use("/company", companyRoutes);
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(new ExpressError(404, "Not Found"));
    });
    this.app.use(ExpressErrorMiddleWare);
  }

  public start(port: number) {
    this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}

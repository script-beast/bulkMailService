import { z } from "zod";

const addCompany = z.object({
  name: z.string().min(3).max(255),
  companyName: z.string().min(3).max(255),
  email: z.string().email(),
  designation: z.string().min(3).max(255),
});

export default addCompany;
type addCompanyType = z.infer<typeof addCompany>;

export { addCompanyType };

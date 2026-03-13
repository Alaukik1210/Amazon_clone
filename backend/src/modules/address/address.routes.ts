import { Router } from "express";
import * as addressController from "./address.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { createAddressSchema, updateAddressSchema } from "./address.validation";

const router = Router();

router.use(authenticate);

router.get("/", addressController.listAddresses);
router.post("/", validate(createAddressSchema), addressController.createAddress);
router.put("/:id", validate(updateAddressSchema), addressController.updateAddress);
router.patch("/:id/default", addressController.setDefault);
router.delete("/:id", addressController.deleteAddress);

export default router;

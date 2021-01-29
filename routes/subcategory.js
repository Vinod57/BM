var express = require("express");
const SubCategoryController = require("../controllers/SubCategoryController");

var router = express.Router();

router.get("/", SubCategoryController.CategoryList);
router.post("/", SubCategoryController.CategoryStore);
router.put("/:id", SubCategoryController.CategoryUpdate);
router.delete("/:id", SubCategoryController.CategoryDelete);

module.exports = router;

const express = require("express")
const { protect } = require("../middleware/auth")
const cityController = require("../controllers/cityController")

const router = express.Router()
// router.use(protect)
router.get("/all",cityController.getAllCities)
router.post("/add",cityController.addCity)

module.exports = router
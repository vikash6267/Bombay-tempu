const express = require("express")
const userController = require("../controllers/userController")
const { protect, restrictTo } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Protect all routes
router.use(protect)

router
  .route("/")
  .get(restrictTo("admin"), userController.getAllUsers)
  .post(restrictTo("admin"), userController.createUser)

  
router.get("/stats", userController.getStats)
router.route("/profile").get(userController.getProfile).patch(userController.updateProfile)

router.post("/profile/photo", upload.single("photo"), userController.uploadProfilePhoto)

router
  .route("/:id")
  .get(restrictTo("admin"), userController.getUser)
  .patch(restrictTo("admin"), userController.updateUser)
  .delete(restrictTo("admin"), userController.deleteUser)

router.patch("/:id/activate", restrictTo("admin"), userController.activateUser)

router.patch("/:id/deactivate", restrictTo("admin"), userController.deactivateUser)
router.post("/create",userController.createUser)


module.exports = router

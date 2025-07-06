const City = require("../models/Citys");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const INDIAN_CITIES = [
  {
    city: "Shimla",
    state: "Himachal Pradesh",
    pincode: "171001",
  },
  {
    city: "Manali",
    state: "Himachal Pradesh",
    pincode: "175131",
  },
  {
    city: "Dharamshala",
    state: "Himachal Pradesh",
    pincode: "176215",
  },
  {
    city: "Kullu",
    state: "Himachal Pradesh",
    pincode: "175101",
  },
  {
    city: "Solan",
    state: "Himachal Pradesh",
    pincode: "173212",
  },
  {
    city: "Mandi",
    state: "Himachal Pradesh",
    pincode: "175001",
  },
  {
    city: "Palampur",
    state: "Himachal Pradesh",
    pincode: "176061",
  },
  {
    city: "Una",
    state: "Himachal Pradesh",
    pincode: "177209",
  },
  {
    city: "Chamba",
    state: "Himachal Pradesh",
    pincode: "176310",
  },
  {
    city: "Hamirpur",
    state: "Himachal Pradesh",
    pincode: "177001",
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  },
  {
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  },
  {
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440001",
  },
  {
    city: "Nashik",
    state: "Maharashtra",
    pincode: "422001",
  },
  {
    city: "Aurangabad",
    state: "Maharashtra",
    pincode: "431001",
  },
  {
    city: "Solapur",
    state: "Maharashtra",
    pincode: "413001",
  },
  {
    city: "Kolhapur",
    state: "Maharashtra",
    pincode: "416001",
  },
  {
    city: "Sangli",
    state: "Maharashtra",
    pincode: "416416",
  },
  {
    city: "Satara",
    state: "Maharashtra",
    pincode: "415001",
  },
  {
    city: "Ahmednagar",
    state: "Maharashtra",
    pincode: "414001",
  },
  {
    city: "Latur",
    state: "Maharashtra",
    pincode: "413512",
  },
  {
    city: "Akola",
    state: "Maharashtra",
    pincode: "444001",
  },
  {
    city: "Nanded",
    state: "Maharashtra",
    pincode: "431601",
  },
  {
    city: "Jalgaon",
    state: "Maharashtra",
    pincode: "425001",
  },
  {
    city: "Thane",
    state: "Maharashtra",
    pincode: "400601",
  },
  {
    city: "Vasai-Virar",
    state: "Maharashtra",
    pincode: "401201",
  },
  {
    city: "Kalyan-Dombivli",
    state: "Maharashtra",
    pincode: "421201",
  },
  {
    city: "Navi Mumbai",
    state: "Maharashtra",
    pincode: "400614",
  },
  {
    city: "Chandrapur",
    state: "Maharashtra",
    pincode: "442401",
  },
  {
    city: "Parbhani",
    state: "Maharashtra",
    pincode: "431401",
  },
  {
    city: "Gurgaon",
    state: "Haryana",
    pincode: "122001",
  },
  {
    city: "Faridabad",
    state: "Haryana",
    pincode: "121001",
  },
  {
    city: "Panipat",
    state: "Haryana",
    pincode: "132103",
  },
  {
    city: "Ambala",
    state: "Haryana",
    pincode: "134003",
  },
  {
    city: "Yamunanagar",
    state: "Haryana",
    pincode: "135001",
  },
  {
    city: "Rohtak",
    state: "Haryana",
    pincode: "124001",
  },
  {
    city: "Hisar",
    state: "Haryana",
    pincode: "125001",
  },
  {
    city: "Karnal",
    state: "Haryana",
    pincode: "132001",
  },
  {
    city: "Sonipat",
    state: "Haryana",
    pincode: "131001",
  },
  {
    city: "Panchkula",
    state: "Haryana",
    pincode: "134109",
  },
  {
    city: "Bhiwani",
    state: "Haryana",
    pincode: "127021",
  },
  {
    city: "Sirsa",
    state: "Haryana",
    pincode: "125055",
  },
  {
    city: "Jind",
    state: "Haryana",
    pincode: "126102",
  },
  {
    city: "Thanesar",
    state: "Haryana",
    pincode: "136118",
  },
  {
    city: "Kaithal",
    state: "Haryana",
    pincode: "136027",
  },
  {
    city: "Rewari",
    state: "Haryana",
    pincode: "123401",
  },
  {
    city: "Narnaul",
    state: "Haryana",
    pincode: "123001",
  },
  {
    city: "Palwal",
    state: "Haryana",
    pincode: "121102",
  },
  {
    city: "Ludhiana",
    state: "Punjab",
    pincode: "141001",
  },
  {
    city: "Amritsar",
    state: "Punjab",
    pincode: "143001",
  },
  {
    city: "Jalandhar",
    state: "Punjab",
    pincode: "144001",
  },
  {
    city: "Patiala",
    state: "Punjab",
    pincode: "147001",
  },
  {
    city: "Bathinda",
    state: "Punjab",
    pincode: "151001",
  },
  {
    city: "Hoshiarpur",
    state: "Punjab",
    pincode: "146001",
  },
  {
    city: "Mohali",
    state: "Punjab",
    pincode: "160055",
  },
  {
    city: "Batala",
    state: "Punjab",
    pincode: "143505",
  },
  {
    city: "Pathankot",
    state: "Punjab",
    pincode: "145001",
  },
  {
    city: "Moga",
    state: "Punjab",
    pincode: "142001",
  },
  {
    city: "Abohar",
    state: "Punjab",
    pincode: "152116",
  },
  {
    city: "Malerkotla",
    state: "Punjab",
    pincode: "148023",
  },
  {
    city: "Khanna",
    state: "Punjab",
    pincode: "141401",
  },
  {
    city: "Phagwara",
    state: "Punjab",
    pincode: "144401",
  },
  {
    city: "Muktsar",
    state: "Punjab",
    pincode: "152026",
  },
  {
    city: "Barnala",
    state: "Punjab",
    pincode: "148101",
  },
  {
    city: "Firozpur",
    state: "Punjab",
    pincode: "152002",
  },
  {
    city: "Kapurthala",
    state: "Punjab",
    pincode: "144601",
  },
  {
    city: "Zirakpur",
    state: "Punjab",
    pincode: "140603",
  },
  {
    city: "Kot Kapura",
    state: "Punjab",
    pincode: "151204",
  },
  {
    city: "Dehradun",
    state: "Uttarakhand",
    pincode: "248001",
  },
  {
    city: "Haridwar",
    state: "Uttarakhand",
    pincode: "249401",
  },
  {
    city: "Roorkee",
    state: "Uttarakhand",
    pincode: "247667",
  },
  {
    city: "Haldwani",
    state: "Uttarakhand",
    pincode: "263139",
  },
  {
    city: "Rudrapur",
    state: "Uttarakhand",
    pincode: "263153",
  },
  {
    city: "Kashipur",
    state: "Uttarakhand",
    pincode: "244713",
  },
  {
    city: "Rishikesh",
    state: "Uttarakhand",
    pincode: "249201",
  },
  {
    city: "Kotdwar",
    state: "Uttarakhand",
    pincode: "246149",
  },
  {
    city: "Nainital",
    state: "Uttarakhand",
    pincode: "263002",
  },
  {
    city: "Almora",
    state: "Uttarakhand",
    pincode: "263601",
  },
  {
    city: "Pithoragarh",
    state: "Uttarakhand",
    pincode: "262501",
  },
  {
    city: "Pauri",
    state: "Uttarakhand",
    pincode: "246001",
  },
  {
    city: "Tehri",
    state: "Uttarakhand",
    pincode: "249001",
  },
  {
    city: "Bageshwar",
    state: "Uttarakhand",
    pincode: "263642",
  },
  {
    city: "Champawat",
    state: "Uttarakhand",
    pincode: "262523",
  },
  {
    city: "Mussoorie",
    state: "Uttarakhand",
    pincode: "248179",
  },
  {
    city: "Tanakpur",
    state: "Uttarakhand",
    pincode: "262309",
  },
  {
    city: "Vikasnagar",
    state: "Uttarakhand",
    pincode: "248198",
  },
];



async function replaceAllCities() {
  try {
    console.log("Deleting old cities...");
    await City.deleteMany({});

    console.log("Inserting new cities...");
    const inserted = await City.insertMany(INDIAN_CITIES);

    console.log(`✅ Inserted ${inserted.length} cities successfully.`);
  } catch (error) {
    console.error("❌ Failed to replace cities:", error);
  }
}
const getAllCities = catchAsync(async (req, res, next) => {
  const cities = await City.find().sort({ createdAt: -1 });
// await replaceAllCities()
  res.status(200).json({
    status: "success",
    results: cities.length,
    data: {
      cities,
    },
  });
});

const addCity = catchAsync(async (req, res, next) => {
  const {city, state, pincode} = req.body;
  if (!city ) {
    return res.status(400).json({message: "All fields are required"});
  }
  const newcity = await City.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      newcity,
    },
  });
});

module.exports = {
  getAllCities,
  addCity,
};

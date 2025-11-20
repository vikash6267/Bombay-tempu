import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getCitiesSuccess } from "@/lib/slices/citySlice";

export function CitySelect({
  value,
  onChange,
  placeholder = "Search for a city...",
  error,
  label,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [addCity, setAddCity] = useState(false);

  const { cities } = useSelector((state) => state.city);
  const dispatch = useDispatch();

  // Fetch cities using React Query
  const { data: citiesData, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["cities"],
    queryFn: () => api.get("/cities/all"),
  });

  // Debug: Check API response
  console.log("=== CITY SELECT DEBUG ===");
  console.log("1. citiesData:", citiesData);
  console.log("2. isLoading:", isLoading);
  console.log("3. isError:", isError);
  console.log("4. queryError:", queryError);

  // Update Redux when cities data changes
  useEffect(() => {
    console.log("5. useEffect triggered, citiesData:", citiesData);
    if (citiesData?.data?.data?.cities) {
      console.log("6. Cities fetched:", citiesData.data.data.cities.length);
      console.log("7. Dispatching to Redux...");
      dispatch(getCitiesSuccess(citiesData.data.data.cities));
    } else {
      console.log("6. No cities in response, path:", citiesData?.data);
    }
  }, [citiesData, dispatch]);

  // Debug: Check Redux state
  console.log("8. Redux cities state:", cities);
  console.log("========================");

  // Mutation to add city
  const mutation = useMutation({
    mutationFn: (data) => api.post("/cities/add", data),
    onSuccess: (res) => {
      // Extract the new city object
      const newCityObj = res.data?.data?.newCity;

      if (!newCityObj) return;

      // Get existing cities from Redux safely
      const existingCities = Array.isArray(cities) ? cities : [];

      // Add the new city to the list
      const updatedCities = [...existingCities, newCityObj];

      // Update Redux
      dispatch(getCitiesSuccess(updatedCities));

      // Select the new city in the dropdown
      handleSelect(newCityObj);
    },
  });

  // Generate default date-based pincode DDMMYY
  const generateDefaultDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  };

  const handleSelect = useCallback(
    (city) => {
      onChange(city);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const displayValue = value
    ? `${value.city}, ${value.state}, ${value.pincode}`
    : "";

  // Safe filteredCities, default to empty array if cities is not array
  const filteredCities = useMemo(() => {
    const cityList = Array.isArray(cities) ? cities : [];
    console.log("Filtered Cities Count:", cityList.length);
    if (!search) return cityList.slice(0, 50);
    return cityList
      .filter(
        (city) =>
          city.city.toLowerCase().includes(search.toLowerCase()) ||
          city.state.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 50);
  }, [search, cities]);

  const handleAddCity = () => {
    if (!newCity) return;

    const pincode = newPincode || generateDefaultDate();
    const newCityData = { city: newCity, state: newState, pincode };

    mutation.mutate(newCityData);

    // Reset fields
    setNewCity("");
    setNewState("");
    setNewPincode("");
    setOpen(false);
    setAddCity(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${
              error ? "border-red-500" : ""
            }`}
          >
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span className={!value ? "text-gray-500" : ""}>
                {displayValue || placeholder}
              </span>
            </div>
            <Search className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command className="w-full">
            <CommandInput
              placeholder="Search cities..."
              value={search}
              onValueChange={setSearch}
            />

            {!addCity && (
              <Button
                onClick={() => setAddCity(true)}
                variant="outline"
                className="w-full"
              >
                Add New City
              </Button>
            )}

            <CommandList className="max-h-60">
              <CommandEmpty>No cities found.</CommandEmpty>
              <CommandGroup>
                {filteredCities.map((city) => (
                  <CommandItem
                    key={`${city.city}-${city.state}-${city.pincode}`}
                    value={`${city.city} ${city.state} ${city.pincode}`}
                    onSelect={() => handleSelect(city)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <div className="font-medium">{city.city}</div>
                        <div className="text-sm text-gray-500">
                          {city.state}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {city.pincode}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          <div className={`mt-4 max-w-lg p-2 ${addCity ? "block" : "hidden"}`}>
            <input
              type="text"
              placeholder="City Name"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="State Name"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="Pincode (optional)"
              value={newPincode}
              onChange={(e) => setNewPincode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <div className="flex flex-row justify-end gap-4">
              <Button variant="outline" onClick={() => setAddCity(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCity} className="w-auto">
                Add City
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CitySelect;

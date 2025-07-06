import {useState, useMemo, useCallback, useEffect, use} from "react";
import {Search, MapPin} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import api from "@/lib/api";
import {useDispatch, useSelector} from "react-redux";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getCitiesSuccess} from "@/lib/slices/citySlice";

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
  const {cities} = useSelector((state) => state.city);
  const dispatch = useDispatch();
  const mutaion = useMutation({
    mutationFn: (data) => api.post("/cities/add", data),
  });

  const handleSelect = useCallback(
    (city) => {
      onChange(city);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const displayValue = value
    ? `${value.city}, ${value.state},${value.pincode}`
    : "";

  const filteredCities = useMemo(() => {
    if (!search) return cities?.slice(0, 59); // Show first 50 cities by default

    return cities
      ?.filter(
        (city) =>
          city.city.toLowerCase().includes(search.toLowerCase()) ||
          city.state.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 50); // Limit results for performance
  }, [search]);
  

  const handleAddCity = () => {
    if (newCity ) {
      const newCityData = {city: newCity, state: newState, pincode: newPincode};
      mutaion.mutate(newCityData);
      setNewCity("");
      setNewState("");
      setNewPincode("");
      handleSelect({city: newCity, state: newState, pincode: newPincode});
      setOpen(false);
      setAddCity(false);
    }
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
            }`}>
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
          <Command className={"w-full"}>
            <CommandInput
              placeholder="Search cities..."
              value={search}
              onValueChange={setSearch}
            />
            {!addCity && (
              <Button
                onClick={() => setAddCity((prev) => !prev)}
                variant={"outline"}
                className={"w-full"}>
                Add New City
              </Button>
            )}
            <CommandList className="max-h-60">
              <CommandEmpty>No cities found.</CommandEmpty>
              <CommandGroup>
                {filteredCities?.map((city, index) => (
                  <CommandItem
                    key={`${city.city}-${city.state}-${city.pincode}`}
                    value={`${city.city} ${city.state} ${city.pincode}`}
                    onSelect={() => handleSelect(city)}
                    className="flex items-center justify-between">
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
          <div
            className={"mt-4 max-w-lg p-2 " + (addCity ? "block" : "hidden")}>
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
              placeholder="Pincode"
              value={newPincode}
              onChange={(e) => setNewPincode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <div className="flex flex-row justify-end gap-4">
              <Button
                variant={"outline"}
                onClick={() => setAddCity((prev) => !prev)}>
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

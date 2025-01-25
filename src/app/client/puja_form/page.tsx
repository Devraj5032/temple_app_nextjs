"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select as ChakraSelect,
  Button,
  Checkbox,
  CheckboxGroup,
  Stack,
  useToast,
  Text,
  VStack,
  HStack,
  Heading,
  Divider,
  Container,
  SimpleGrid,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import { CalendarIcon, CloseIcon } from "@chakra-ui/icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import AsyncSelect from "react-select/async";

const statesInIndia = [
  "Andhra Pradesh",
  "Bihar",
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
];

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "white",
    borderColor: useColorModeValue("gray.200", "gray.600"),
    "&:hover": {
      borderColor: useColorModeValue("gray.300", "gray.500"),
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: useColorModeValue("white", "gray.700"),
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? useColorModeValue("blue.50", "blue.900")
      : "transparent",
    color: useColorModeValue("black", "white"),
  }),
};

interface Puja {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface FamilyMember {
  name: string;
  nakshatram: string;
  gotram: string;
  rashi: string;
}

interface Option {
  id: string;
  name_english: string;
  name_hindi: string;
  name_tamil: string;
}

const PujaBookingForm = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile_number: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pin_code: "",
    selected_puja: null as Puja | null,
    remarks: "",
    duration: "one_time",
    start_date: null as Date | null,
    end_date: null as Date | null,
    weekly_days: [] as string[],
    monthly_date: null as Date | null,
    payment_date: null as Date | null,
    image: null,
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [languagePreference, setLanguagePreference] = useState<
    "english" | "hindi" | "tamil"
  >("english");

  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    fetchPujas();
  }, []);

  const fetchPujas = async () => {
    try {
      const response = await fetch("/server/get_pujas");
      if (!response.ok) {
        throw new Error("Failed to fetch pujas");
      }
      const data = await response.json();
      setPujas(data);
    } catch (error) {
      console.error("Error fetching pujas:", error);
      toast({
        title: "Error",
        description: "Failed to load pujas. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePujaChange = (selectedOption: any) => {
    const selectedPuja = pujas.find(
      (puja) => puja.id === selectedOption?.value
    );
    setFormData({ ...formData, selected_puja: selectedPuja || null });
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { name: string; value: string }
  ) => {
    const { name, value } = "target" in e ? e.target : e;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleCheckboxChange = (selectedDays: string[]) => {
    setFormData({ ...formData, weekly_days: selectedDays });
  };

  const handleDateChange = (date: Date | null, field: string) => {
    setFormData({ ...formData, [field]: date });
  };

  useEffect(() => {
    if (formData.selected_puja && formData.start_date) {
      const price = formData.selected_puja.price;
      const start = new Date(formData.start_date);
      let totalPrice = 0;

      switch (formData.duration) {
        case "one_time":
          totalPrice = price;
          break;
        case "daily":
          if (formData.end_date) {
            const end = new Date(formData.end_date);
            const days =
              Math.ceil(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1;
            totalPrice = price * days;
          }
          break;
        case "weekly":
          if (formData.end_date && formData.weekly_days.length > 0) {
            const end = new Date(formData.end_date);
            let count = 0;
            for (
              let d = new Date(start);
              d <= end;
              d.setDate(d.getDate() + 1)
            ) {
              if (
                formData.weekly_days.includes(
                  [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ][d.getDay()]
                )
              ) {
                count++;
              }
            }
            totalPrice = price * count;
          }
          break;
        case "monthly":
          if (formData.end_date) {
            const end = new Date(formData.end_date);
            const months = Math.ceil(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
            );
            totalPrice = price * months;
          }
          break;
      }

      setTotalPrice(totalPrice);
    }
  }, [formData]);

  const fetchOptions = async (
    inputValue: string,
    type: "nakshatram" | "gotram" | "rashi"
  ) => {
    try {
      const response = await fetch(
        `/server/getData/get${type.charAt(0).toUpperCase() + type.slice(1)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} options`);
      }
      const data = await response.json();
      return data
        .filter((item: Option) =>
          item[`name_${languagePreference}`]
            .toLowerCase()
            .includes(inputValue.toLowerCase())
        )
        .map((item: Option) => ({
          value: item.id,
          label: item[`name_${languagePreference}`],
          ...item,
        }));
    } catch (error) {
      console.error(`Error fetching ${type} options:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${type} options. Please try again.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return [];
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      { name: "", nakshatram: "", gotram: "", rashi: "" },
    ]);
  };

  const removeFamilyMember = (index: number) => {
    const updatedMembers = [...familyMembers];
    updatedMembers.splice(index, 1);
    setFamilyMembers(updatedMembers);
  };

  const updateFamilyMember = (
    index: number,
    field: keyof FamilyMember,
    value: any
  ) => {
    const updatedMembers = [...familyMembers];
    if (typeof value === "string") {
      updatedMembers[index][field] = value;
    } else {
      updatedMembers[index][field] = value.id;
    }
    setFamilyMembers(updatedMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.mobile_number ||
      !formData.selected_puja ||
      !formData.start_date ||
      (formData.duration !== "one_time" && !formData.end_date) ||
      !formData.payment_date
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const bookingData = {
      ...formData,
      selected_puja: formData.selected_puja.id,
      start_date: formData.start_date.toISOString(),
      end_date:
        formData.duration !== "one_time"
          ? formData.end_date?.toISOString()
          : null,
      weekly_days: formData.duration === "weekly" ? formData.weekly_days : null,
      monthly_date:
        formData.duration === "monthly" && formData.monthly_date
          ? formData.monthly_date.getDate()
          : null,
      payment_date: formData.payment_date.toISOString(),
      total_price: totalPrice,
      family_members: familyMembers,
    };

    try {
      const response = await fetch("/server/puja_form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Puja booking created successfully!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Reset form data
        setFormData({
          first_name: "",
          last_name: "",
          mobile_number: "",
          email: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          pin_code: "",
          selected_puja: null,
          remarks: "",
          duration: "one_time",
          start_date: null,
          end_date: null,
          weekly_days: [],
          monthly_date: null,
          payment_date: null,
          image: null,
        });
        setFamilyMembers([]);
        setTotalPrice(0);
      } else {
        throw new Error(data.message || "Failed to submit booking");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container
      maxWidth={{ base: "100%", md: "800px" }}
      py={4}
      px={{ base: 2, md: 8 }}
    >
      <VStack spacing={{ base: 4, md: 8 }} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" color="blue.600">
          Puja Booking Form
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack
            spacing={{ base: 4, md: 8 }}
            align="stretch"
            bg={bgColor}
            p={{ base: 3, md: 6 }}
            borderRadius="lg"
            boxShadow="md"
            borderWidth={1}
            borderColor={borderColor}
          >
            <Box>
              <Heading as="h2" size="lg" mb={4} color="blue.500">
                Puja Details
              </Heading>
              <SimpleGrid
                columns={{ base: 2, md: 2 }}
                spacing={{ base: 2, md: 6 }}
              >
                <FormControl isRequired>
                  <FormLabel>Select Puja</FormLabel>
                  <Select
                    styles={customSelectStyles}
                    options={pujas.map((puja) => ({
                      value: puja.id,
                      label: `${puja.name} - ₹${puja.price}`,
                    }))}
                    value={
                      formData.selected_puja
                        ? {
                            value: formData.selected_puja.id,
                            label: `${formData.selected_puja.name} - ₹${formData.selected_puja.price}`,
                          }
                        : null
                    }
                    onChange={handlePujaChange}
                    placeholder="Select Puja"
                    isClearable
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Frequency</FormLabel>
                  <ChakraSelect
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    bg="white"
                  >
                    <option value="one_time">One Time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </ChakraSelect>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    as={DatePicker}
                    selected={formData.start_date}
                    onChange={(date: Date) =>
                      handleDateChange(date, "start_date")
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select start date"
                    minDate={new Date()}
                    bg="white"
                  />
                </FormControl>
                {formData.duration !== "one_time" && (
                  <FormControl isRequired>
                    <FormLabel>End Date</FormLabel>
                    <Input
                      as={DatePicker}
                      selected={formData.end_date}
                      onChange={(date: Date) =>
                        handleDateChange(date, "end_date")
                      }
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select end date"
                      minDate={formData.start_date || new Date()}
                      bg="white"
                    />
                  </FormControl>
                )}
                <FormControl isRequired>
                  <FormLabel>Payment Date</FormLabel>
                  <Input
                    as={DatePicker}
                    selected={formData.payment_date}
                    onChange={(date: Date) =>
                      handleDateChange(date, "payment_date")
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select payment date"
                    minDate={new Date()}
                    bg="white"
                  />
                </FormControl>
              </SimpleGrid>
              {formData.duration === "weekly" && (
                <FormControl mt={4}>
                  <FormLabel>Select Days</FormLabel>
                  <CheckboxGroup
                    value={formData.weekly_days}
                    onChange={handleCheckboxChange}
                  >
                    <Stack
                      direction={["row"]}
                      spacing={[1, 2]}
                      wrap="wrap"
                      justify="space-between"
                    >
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => (
                        <Checkbox key={day} value={day}>
                          {day}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </FormControl>
              )}
              {formData.duration === "monthly" && (
                <FormControl mt={4}>
                  <FormLabel>Select Monthly Date</FormLabel>
                  <Input
                    as={DatePicker}
                    selected={formData.monthly_date}
                    onChange={(date: Date) =>
                      handleDateChange(date, "monthly_date")
                    }
                    dateFormat="dd"
                    placeholderText="Select date of the month"
                    showMonthYearPicker={false}
                    showFullMonthYearPicker={false}
                    showTwoColumnMonthYearPicker={false}
                    showYearDropdown={false}
                    showMonthDropdown={false}
                    showPopperArrow={false}
                    bg="white"
                  />
                </FormControl>
              )}
            </Box>

            <Divider />

            <Box>
              <Heading as="h2" size="lg" mb={4} color="blue.500">
                Personal Information
              </Heading>
              <SimpleGrid
                columns={{ base: 2, md: 2 }}
                spacing={{ base: 2, md: 6 }}
              >
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Mobile Number</FormLabel>
                  <Input
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Address Line 1</FormLabel>
                  <Input
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Address Line 2</FormLabel>
                  <Input
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>City</FormLabel>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>State</FormLabel>
                  <Select
                    styles={customSelectStyles}
                    options={statesInIndia.map((state) => ({
                      value: state,
                      label: state,
                    }))}
                    value={
                      formData.state
                        ? { value: formData.state, label: formData.state }
                        : null
                    }
                    onChange={(selectedOption) =>
                      setFormData({
                        ...formData,
                        state: selectedOption?.value || "",
                      })
                    }
                    placeholder="Select State"
                    isClearable
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Pin Code</FormLabel>
                  <Input
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleChange}
                    bg="white"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Box>
              <Heading as="h2" size="lg" mb={4} color="blue.500">
                Family Members
              </Heading>
              {familyMembers.map((member, index) => (
                <Box
                  key={index}
                  mb={6}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                  position="relative"
                >
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between" align="flex-start">
                      <FormControl flex={1}>
                        <FormLabel>Name</FormLabel>
                        <Input
                          value={member.name}
                          onChange={(e) =>
                            updateFamilyMember(index, "name", e.target.value)
                          }
                          bg="white"
                        />
                      </FormControl>
                      <IconButton
                        aria-label="Remove family member"
                        icon={<CloseIcon />}
                        onClick={() => removeFamilyMember(index)}
                        colorScheme="red"
                        size="sm"
                        position="absolute"
                        top={2}
                        right={2}
                      />
                    </HStack>
                    <HStack spacing={4}>
                      <FormControl flex={1}>
                        <FormLabel>Nakshatram</FormLabel>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          loadOptions={(inputValue) =>
                            fetchOptions(inputValue, "nakshatram")
                          }
                          onChange={(option) =>
                            updateFamilyMember(index, "nakshatram", option)
                          }
                          styles={customSelectStyles}
                          placeholder="Select Nakshatram"
                        />
                      </FormControl>
                      <FormControl flex={1}>
                        <FormLabel>Gotram</FormLabel>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          loadOptions={(inputValue) =>
                            fetchOptions(inputValue, "gotram")
                          }
                          onChange={(option) =>
                            updateFamilyMember(index, "gotram", option)
                          }
                          styles={customSelectStyles}
                          placeholder="Select Gotram"
                        />
                      </FormControl>
                    </HStack>
                    <FormControl>
                      <FormLabel>Rashi</FormLabel>
                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={(inputValue) =>
                          fetchOptions(inputValue, "rashi")
                        }
                        onChange={(option) =>
                          updateFamilyMember(index, "rashi", option)
                        }
                        styles={customSelectStyles}
                        placeholder="Select Rashi"
                      />
                    </FormControl>
                  </VStack>
                </Box>
              ))}
              <Button onClick={addFamilyMember} colorScheme="blue" mt={2}>
                Add Family Member
              </Button>
            </Box>

            <Divider />

            <Box>
              <Heading as="h2" size="lg" mb={4} color="blue.500">
                Additional Information
              </Heading>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Remarks</FormLabel>
                  <Input
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Add any remarks here"
                    bg="white"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Attach Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    bg="white"
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            <Box>
              <Heading as="h2" size="lg" mb={4} color="blue.500">
                Booking Summary
              </Heading>
              <SimpleGrid
                columns={{ base: 2, md: 1 }}
                spacing={2}
                p={4}
                borderWidth={1}
                borderRadius="lg"
                bg="blue.50"
              >
                <Text fontWeight="bold" fontSize="xl">
                  Total Price: ₹{totalPrice}
                </Text>
                {formData.selected_puja && (
                  <Text fontSize="md">
                    Base Price: ₹{formData.selected_puja.price} per{" "}
                    {formData.duration === "one_time"
                      ? "puja"
                      : formData.duration === "daily"
                      ? "day"
                      : formData.duration === "weekly"
                      ? "week"
                      : "month"}
                  </Text>
                )}
                {formData.start_date && (
                  <Text fontSize="md">
                    Start Date:{" "}
                    {formData.start_date.toLocaleDateString("en-GB")}
                  </Text>
                )}
                {formData.duration !== "one_time" && formData.end_date && (
                  <Text fontSize="md">
                    End Date: {formData.end_date.toLocaleDateString("en-GB")}
                  </Text>
                )}
                {formData.payment_date && (
                  <Text fontSize="md">
                    Payment Date:{" "}
                    {formData.payment_date.toLocaleDateString("en-GB")}
                  </Text>
                )}
              </SimpleGrid>
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              mt={4}
            >
              Submit Booking
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
};

export default PujaBookingForm;

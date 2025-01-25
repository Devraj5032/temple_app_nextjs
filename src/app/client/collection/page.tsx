"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  VStack,
  Collapse,
  useDisclosure,
  Flex,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";

const CollectionFilter = () => {
  const toast = useToast();

  // State variables
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pujaId, setPujaId] = useState("");
  const [collectionType, setCollectionType] = useState("");
  const [pujas, setPujas] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Fetch puja data on component mount
  useEffect(() => {
    const fetchPujas = async () => {
      try {
        const response = await fetch("/server/get_pujas");
        const data = await response.json();
        setPujas(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch puja options.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchPujas();
  }, [toast]);

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!startDate || !endDate || !collectionType) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/server/collection/collectionByRange/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          pujaId: pujaId || null,
          collectionType,
        }),
      });

      const result = await response.json();
      setData(result.data);
      toast({
        title: "Success",
        description: "Data fetched successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    setLoading(false);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!data) return [];
    return [...data.details].sort((a, b) => {
      if (sortColumn === "Puja Name") {
        return sortDirection === "asc"
          ? a.puja_name.localeCompare(b.puja_name)
          : b.puja_name.localeCompare(a.puja_name);
      } else if (sortColumn === "Date") {
        return sortDirection === "asc"
          ? new Date(a.payment_date || a.puja_date) -
              new Date(b.payment_date || b.puja_date)
          : new Date(b.payment_date || b.puja_date) -
              new Date(a.payment_date || a.puja_date);
      } else if (sortColumn === "Total Collection") {
        return sortDirection === "asc"
          ? (a.total_collection || a.total_price) -
              (b.total_collection || b.total_price)
          : (b.total_collection || b.total_price) -
              (a.total_collection || a.total_price);
      }
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const MotionCard = motion(Card);

  return (
    <Box maxWidth="container.xl" margin="auto" padding={8}>
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CardHeader>
          <Heading size="lg">Collection Filter</Heading>
          <Text mt={2}>
            Filter collection data by date range, puja, and collection type.
          </Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={6}>
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={6}
              width="100%"
            >
              <FormControl>
                <FormLabel>Start Date</FormLabel>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  customInput={
                    <Button
                      leftIcon={<CalendarIcon />}
                      variant="outline"
                      width="100%"
                    >
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>End Date</FormLabel>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  customInput={
                    <Button
                      leftIcon={<CalendarIcon />}
                      variant="outline"
                      width="100%"
                    >
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Select Puja</FormLabel>
                <Select
                  placeholder="All Pujas"
                  value={pujaId}
                  onChange={(e) => setPujaId(e.target.value)}
                >
                  {pujas.map((puja) => (
                    <option key={puja.id} value={puja.id}>
                      {puja.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Type of Collection</FormLabel>
                <Select
                  placeholder="Select type"
                  value={collectionType}
                  onChange={(e) => setCollectionType(e.target.value)}
                >
                  <option value="payment_date">
                    Collection by Payment Date
                  </option>
                  <option value="puja_date">Collection by Puja Date</option>
                </Select>
              </FormControl>
            </Grid>

            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Submitting"
              width="100%"
              _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
              transition="all 0.2s"
            >
              Submit
            </Button>
          </VStack>
        </CardBody>
      </MotionCard>

      {loading && (
        <Flex justify="center" align="center" minHeight="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      )}

      {data && (
        <MotionCard
          mt={8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CardHeader>
            <Heading size="md">Collection Results</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  {["Puja Name", "Date", "Total Collection"].map((column) => (
                    <Th
                      key={column}
                      cursor="pointer"
                      onClick={() => handleSort(column)}
                    >
                      {column}
                      {sortColumn === column && (
                        <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {sortedData
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((record, index) => (
                    <Tr key={index}>
                      <Td>{record.puja_name || "N/A"}</Td>
                      <Td>
                        {record.payment_date || record.puja_date
                          ? format(
                              addMinutes(
                                parseISO(
                                  record.payment_date || record.puja_date
                                ),
                                330
                              ),
                              "yyyy-MM-dd"
                            )
                          : "N/A"}
                      </Td>
                      <Td>
                        <Badge colorScheme="green" fontSize="md">
                          {record.total_collection || record.total_price}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
            <Flex justify="space-between" align="center" mt={4}>
              <Text fontWeight="bold">
                Total Collection: {data.total_collection}
              </Text>
              <Flex>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  isDisabled={currentPage === 1}
                  mr={2}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  isDisabled={currentPage * itemsPerPage >= data.details.length}
                >
                  Next
                </Button>
              </Flex>
            </Flex>
          </CardBody>
        </MotionCard>
      )}
    </Box>
  );
};

export default CollectionFilter;

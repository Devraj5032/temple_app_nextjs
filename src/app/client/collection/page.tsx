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
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const [bookingData, setBookingData] = useState<any[]>(null); // Updated state type
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState("Date");
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
      if (collectionType === "booking") {
        // Make a different API call for booking
        const bookingResponse = await fetch(
          "/server/collection/bookingByRange/",
          {
            // Updated API endpoint
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: format(startDate, "yyyy-MM-dd"),
              endDate: format(endDate, "yyyy-MM-dd"),
              pujaId: pujaId || null,
            }),
          }
        );
        const bookingResult = await bookingResponse.json();
        setBookingData(bookingResult); // Set booking data
        setData(null); // Clear the regular collection data
      } else {
        // Existing logic for other collection types
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
      }

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
    const details = [...data.details];

    return details.sort((a, b) => {
      const dateA = new Date(a.puja_date || a.payment_date);
      const dateB = new Date(b.puja_date || b.payment_date);

      if (sortColumn === "Date") {
        return sortDirection === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else if (sortColumn === "Puja Name" && !pujaId) {
        return sortDirection === "asc"
          ? a.puja_name.localeCompare(b.puja_name)
          : b.puja_name.localeCompare(a.puja_name);
      } else if (sortColumn === "Collection") {
        const collectionA = Number.parseFloat(
          a.total_collection || a.total_price
        );
        const collectionB = Number.parseFloat(
          b.total_collection || b.total_price
        );
        return sortDirection === "asc"
          ? collectionA - collectionB
          : collectionB - collectionA;
      }
      return 0;
    });
  }, [data, sortColumn, sortDirection, pujaId]);

  const MotionCard = motion(Card);

  const columns = pujaId
    ? ["Date", "Collection"]
    : ["Date", "Puja Name", "Collection"];

  const handlePDFDownload = () => {
    const doc = new jsPDF();
    doc.text("Collection Report", 14, 15);

    const tableColumn = columns;
    const tableRows = sortedData.map((record) => [
      format(
        addMinutes(parseISO(record.puja_date || record.payment_date), 330),
        "dd-MM-yyyy"
      ),
      !pujaId ? record.puja_name : "",
      Number.parseFloat(record.total_collection || record.total_price).toFixed(
        2
      ),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    const finalY = doc.lastAutoTable.finalY || 20;
    doc.text(
      `Total Collection: ${Number.parseFloat(data.total_collection).toFixed(
        2
      )}`,
      14,
      finalY + 10
    );

    // Add filter information
    doc.text(`Filters:`, 14, finalY + 20);
    doc.text(`Start Date: ${format(startDate, "dd-MM-yyyy")}`, 14, finalY + 30);
    doc.text(`End Date: ${format(endDate, "dd-MM-yyyy")}`, 14, finalY + 40);
    doc.text(
      `Puja: ${pujaId ? pujas.find((p) => p.id === pujaId).name : "All Pujas"}`,
      14,
      finalY + 50
    );
    doc.text(
      `Collection Type: ${
        collectionType === "payment_date" ? "Payment Date" : "Puja Date"
      }`,
      14,
      finalY + 60
    );

    doc.save("collection_report.pdf");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(
      sortedData.map((record) => ({
        Date: format(
          addMinutes(parseISO(record.puja_date || record.payment_date), 330),
          "dd-MM-yyyy"
        ),
        "Puja Name": !pujaId ? record.puja_name : "",
        Collection: Number.parseFloat(
          record.total_collection || record.total_price
        ).toFixed(2),
      }))
    );

    // Add filter information
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [`Filters:`],
        [`Start Date: ${format(startDate, "dd-MM-yyyy")}`],
        [`End Date: ${format(endDate, "dd-MM-yyyy")}`],
        [
          `Puja: ${
            pujaId ? pujas.find((p) => p.id === pujaId).name : "All Pujas"
          }`,
        ],
        [
          `Collection Type: ${
            collectionType === "payment_date" ? "Payment Date" : "Puja Date"
          }`,
        ],
        [
          `Total Collection: ${Number.parseFloat(data.total_collection).toFixed(
            2
          )}`,
        ],
        [], // Empty row for spacing
      ],
      { origin: -1 }
    ); // This will add the filter info at the end of the sheet

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Collection Report");
    XLSX.writeFile(wb, "collection_report.xlsx");
  };

  const handleBookingPDFDownload = () => {
    const doc = new jsPDF();
    doc.text("Booking Report", 14, 15);

    const tableColumn = [
      "Booking Date",
      "Name",
      "Address",
      "Mobile",
      "Email",
      "City",
      "State",
      "Pincode",
      "Total Price",
    ];
    const tableRows = bookingData.map((booking) => [
      format(new Date(booking.booking_made_on), "dd-MM-yyyy"),
      `${booking.first_name} ${booking.last_name}`,
      booking.address1,
      booking.mobile_number,
      booking.email,
      booking.city,
      booking.state,
      booking.pin_code,
      `₹${booking.total_price}`,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    const finalY = doc.lastAutoTable.finalY || 20;
    doc.text(`Filters:`, 14, finalY + 10);
    doc.text(`Start Date: ${format(startDate, "dd-MM-yyyy")}`, 14, finalY + 20);
    doc.text(`End Date: ${format(endDate, "dd-MM-yyyy")}`, 14, finalY + 30);
    doc.text(
      `Puja: ${pujaId ? pujas.find((p) => p.id === pujaId).name : "All Pujas"}`,
      14,
      finalY + 40
    );

    doc.save("booking_report.pdf");
  };

  const handleBookingExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(
      bookingData.map((booking) => ({
        "Booking Date": format(new Date(booking.booking_made_on), "dd-MM-yyyy"),
        Name: `${booking.first_name} ${booking.last_name}`,
        Address: booking.address1,
        Mobile: booking.mobile_number,
        Email: booking.email,
        City: booking.city,
        State: booking.state,
        Pincode: booking.pin_code,
        "Total Price": `₹${booking.total_price}`,
      }))
    );

    // Add filter information
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [`Filters:`],
        [`Start Date: ${format(startDate, "dd-MM-yyyy")}`],
        [`End Date: ${format(endDate, "dd-MM-yyyy")}`],
        [
          `Puja: ${
            pujaId ? pujas.find((p) => p.id === pujaId).name : "All Pujas"
          }`,
        ],
      ],
      { origin: -1 }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Booking Report");
    XLSX.writeFile(wb, "booking_report.xlsx");
  };

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
            <Grid templateColumns="1fr" gap={6} width="100%">
              <Box display="flex" gap={4}>
                <FormControl flex={1}>
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
                        {startDate
                          ? format(startDate, "dd-MM-yyyy")
                          : "Pick a date"}
                      </Button>
                    }
                  />
                </FormControl>
                <FormControl flex={1}>
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
                        {endDate
                          ? format(endDate, "dd-MM-yyyy")
                          : "Pick a date"}
                      </Button>
                    }
                  />
                </FormControl>
              </Box>
              <Box display="flex" gap={4}>
                <FormControl flex={1}>
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
                <FormControl flex={1}>
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
                    <option value="booking">Booking</option>
                  </Select>
                </FormControl>
              </Box>
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
            {pujaId && (
              <Text mt={2}>
                Showing results for: {pujas.find((p) => p.id === pujaId)?.name}
              </Text>
            )}
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  {columns.map((column) => (
                    <Th
                      key={column}
                      onClick={() => handleSort(column)}
                      cursor="pointer"
                    >
                      {column}{" "}
                      {sortColumn === column &&
                        (sortDirection === "asc" ? "▲" : "▼")}
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
                      <Td>
                        {format(
                          addMinutes(
                            parseISO(record.puja_date || record.payment_date),
                            330
                          ),
                          "dd-MM-yyyy"
                        )}
                      </Td>
                      {!pujaId && <Td>{record.puja_name}</Td>}
                      <Td isNumeric>
                        {Number.parseFloat(
                          record.total_collection || record.total_price
                        ).toFixed(2)}
                      </Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
            <Flex justify="space-between" align="center" mt={4}>
              <Text fontWeight="bold">
                Total Collection:{" "}
                {Number.parseFloat(data.total_collection).toFixed(2)}
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
                  isDisabled={currentPage * itemsPerPage >= sortedData.length}
                >
                  Next
                </Button>
              </Flex>
            </Flex>
            <Flex mt={4} justify="flex-end">
              <Button colorScheme="green" mr={2} onClick={handlePDFDownload}>
                Download PDF
              </Button>
              <Button colorScheme="blue" onClick={handleExcelDownload}>
                Download Excel
              </Button>
            </Flex>
          </CardBody>
        </MotionCard>
      )}

      {bookingData && (
        <MotionCard
          mt={8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CardHeader>
            <Heading size="md">Booking Results</Heading>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th minW={"180px"}>Booking Date</Th>
                    <Th>Name</Th>
                    <Th>Mobile</Th>
                    <Th>Email</Th>
                    <Th minW={"180px"}>Address</Th>
                    <Th>City</Th>
                    <Th>State</Th>
                    <Th>Pincode</Th>
                    <Th>Total Price</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bookingData.map((booking, index) => (
                    <Tr key={index}>
                      <Td>
                        {format(
                          new Date(booking.booking_made_on),
                          "dd-MM-yyyy"
                        )}
                      </Td>
                      <Td>{`${booking.first_name} ${booking.last_name}`}</Td>

                      <Td>{booking.mobile_number}</Td>

                      <Td>{booking.email}</Td>

                      <Td>{booking.address1}</Td>

                      <Td>{booking.city}</Td>

                      <Td>{booking.state}</Td>

                      <Td>{booking.pin_code}</Td>

                      <Td isNumeric>₹{booking.total_price}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
            <Flex mt={4} justify="flex-end">
              <Button
                colorScheme="green"
                mr={2}
                onClick={handleBookingPDFDownload}
              >
                Download PDF
              </Button>
              <Button colorScheme="blue" onClick={handleBookingExcelDownload}>
                Download Excel
              </Button>
            </Flex>
          </CardBody>
        </MotionCard>
      )}
    </Box>
  );
};

export default CollectionFilter;

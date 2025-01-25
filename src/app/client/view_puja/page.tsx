'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Text,
  useToast,
  useBreakpointValue,
  VStack,
  Heading,
  Container,
  InputGroup,
  InputLeftElement,
  Input,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select'; // Import react-select for searchable dropdown
import ViewPuja from '@/app/components/ViewPuja';
import OnMobileViewPujaCards from '@/app/components/OnMobileViewPujaCards';

const ViewBookingForm = () => {
  const [pujas, setPujas] = useState([]);
  const [selectedPuja, setSelectedPuja] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pujaCount, setPujaCount] = useState(0);
  const toast = useToast();

  const isMobileOrTablet = useBreakpointValue({ base: true, md: true, lg: false });

  useEffect(() => {
    fetchPujas();
  }, []);

  const fetchPujas = async () => {
    try {
      const response = await fetch('/server/get_pujas');
      if (!response.ok) throw new Error('Failed to fetch pujas');

      const data = await response.json();
      setPujas([{ id: '', label: 'All Pujas', value: '' }, ...data.map(puja => ({ id: puja.id, label: puja.name, value: puja.id }))]);
    } catch (error) {
      console.error('Error fetching pujas:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pujas. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select both start and end dates.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after the start date.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/server/view_pujas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puja_id: selectedPuja?.value || null,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const { success, data, message } = await response.json();
      if (success) {
        setBookings(data);
        setPujaCount(data.reduce((acc, day) => acc + day.pujas.length, 0));
        toast({
          title: 'Success',
          description: 'Bookings loaded successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setBookings([]);
        setPujaCount(0);
        toast({
          title: 'No Bookings Found',
          description: message || 'No bookings available for the selected criteria.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bookings. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxWidth="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          View Puja Bookings
        </Heading>

        <Box
          bg="white"
          boxShadow="md"
          borderRadius="lg"
          p={6}
        >
          <VStack spacing={4} align="stretch">
            <FormControl id="puja-select">
              <FormLabel>Select Puja</FormLabel>
              <Select
                options={pujas}
                placeholder="Search and select a Puja"
                value={selectedPuja}
                onChange={(selectedOption) => setSelectedPuja(selectedOption)}
                isClearable
              />
            </FormControl>

            <Box display={"flex"} gap={4}>
            <FormControl id="start-date-select">
              <FormLabel>Start Date</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <CalendarIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  as={DatePicker}
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select start date"
                  autoComplete="off"
                  popperPlacement="top-start"
                />
              </InputGroup>
            </FormControl>

            <FormControl id="end-date-select">
              <FormLabel>End Date</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <CalendarIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  as={DatePicker}
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select end date"
                  autoComplete="off"
                  popperPlacement="top-start"
                />
              </InputGroup>
            </FormControl>
            </Box>

            <Button colorScheme="blue" onClick={handleSubmit} size="lg" width="100%">
              Submit
            </Button>
          </VStack>
        </Box>

        {pujaCount > 0 && (
          <Box bg="blue.50" p={4} borderRadius="md">
            <Text fontWeight="bold" textAlign="center">
              {`Total results for ${selectedPuja?.label || 'All Pujas'}: ${pujaCount}`}
            </Text>
          </Box>
        )}

        <Box>
          {bookings.length > 0 ? (
            isMobileOrTablet ? (
              <OnMobileViewPujaCards tableData={bookings} startDate={startDate} endDate={endDate} />
            ) : (
              <ViewPuja tableData={bookings} startDate={startDate} endDate={endDate} />
            )
          ) : (
            <Text textAlign="center">No bookings found for the selected criteria.</Text>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default ViewBookingForm;

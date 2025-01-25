"use client";

import React, { useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon } from "@chakra-ui/icons";

interface Puja {
  id: number;
  puja_name: string;
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  mobile_number: string;
  remarks: string | null;
  date: string;
}

interface ViewPujaProps {
  tableData: Array<{
    date: string;
    pujas: Puja[];
  }>;
  startDate: Date | null;
  endDate: Date | null;
}

const ViewPuja: React.FC<ViewPujaProps> = ({ tableData, startDate, endDate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPuja, setSelectedPuja] = useState<Puja | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const itemsPerPage = 10;

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const filteredData = tableData.flatMap((dayData) =>
    dayData.pujas
      .filter((puja) => {
        const pujaDate = new Date(dayData.date);
        if (startDate && endDate) {
          return pujaDate >= startDate && pujaDate <= endDate;
        }
        return true;
      })
      .map((puja) => ({ ...puja, date: dayData.date }))
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const openPujaDetails = (puja: Puja) => {
    setSelectedPuja(puja);
    onOpen();
  };

  return (
    <Box p={4} maxW="full" mx="auto">
      {filteredData.length > 0 ? (
        <VStack spacing={4} align="stretch">
          <TableContainer>
            <Table variant="simple" colorScheme="blue" size="sm">
              <Thead>
                <Tr bg={useColorModeValue("blue.50", "blue.900")}>
                  <Th>Sl no.</Th>
                  <Th>Date</Th>
                  <Th>Puja</Th>
                  <Th>Devotee</Th>
                  <Th>Mobile</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentData.map((puja, index) => (
                  <Tr key={`${puja.date}-${puja.id}`}>
                    <Td>{(currentPage - 1) * itemsPerPage + index + 1}</Td>
                    <Td>{new Date(puja.date).toLocaleDateString()}</Td>
                    <Td>
                      <Badge colorScheme="blue">{puja.puja_name}</Badge>
                    </Td>
                    <Td>
                      {puja.first_name} {puja.last_name}
                    </Td>
                    <Td>{puja.mobile_number}</Td>
                    <Td>
                      <Tooltip label="View Details" hasArrow>
                        <IconButton
                          aria-label="View puja details"
                          icon={<InfoIcon />}
                          size="sm"
                          onClick={() => openPujaDetails(puja)}
                          colorScheme="blue"
                          variant="outline"
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          <Flex justify="space-between" align="center" w="full">
            <Text fontSize="sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </Text>
            <HStack>
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                size="sm"
              >
                <ChevronLeftIcon />
                Previous
              </Button>
              <Text fontSize="sm">
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === totalPages}
                size="sm"
              >
                Next
                <ChevronRightIcon />
              </Button>
            </HStack>
          </Flex>
        </VStack>
      ) : (
        <Text textAlign="center" mt={4}>
          No data available for the selected date range.
        </Text>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Puja Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPuja && (
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="bold">Date:</Text>
                  <Text>{new Date(selectedPuja.date).toLocaleDateString()}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Puja:</Text>
                  <Badge colorScheme="blue">{selectedPuja.puja_name}</Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">Devotee:</Text>
                  <Text>
                    {selectedPuja.first_name} {selectedPuja.last_name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedPuja.mobile_number}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Address:</Text>
                  <Text>{selectedPuja.address1}</Text>
                  {selectedPuja.address2 && <Text>{selectedPuja.address2}</Text>}
                </Box>
                <Box>
                  <Text fontWeight="bold">Remarks:</Text>
                  <Text>{selectedPuja.remarks || "No remarks"}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ViewPuja;


"use client";

import React from "react";
import {
  Box,
  Text,
  Flex,
  VStack,
  HStack,
  useColorModeValue,
  Badge,
  Divider,
  Icon,
  SimpleGrid,
} from "@chakra-ui/react";
import { PhoneIcon, CalendarIcon, InfoIcon } from "@chakra-ui/icons";

interface Puja {
  id: number;
  puja_name: string;
  first_name: string;
  last_name: string;
  address1: string | null;
  address2: string | null;
  mobile_number: string;
  remarks: string | null;
  date: string;
}

interface OnMobileViewPujaCardsProps {
  tableData: { date: string; pujas: Puja[] }[];
  startDate: Date | null;
  endDate: Date | null;
}

const OnMobileViewPujaCards: React.FC<OnMobileViewPujaCardsProps> = ({
  tableData = [],
  startDate,
  endDate,
}) => {
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

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const badgeColor = useColorModeValue("purple.500", "purple.300");

  return (
    <Box width="100%" maxWidth="600px" margin="auto" padding={4} className="">
      {filteredData.length > 0 ? (
        filteredData.map((item, index) => (
          <Box
            key={`${item.date}-${item.id}`}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={3}
            mb={4}
            boxShadow="sm"
            bg={bgColor}
            borderColor={borderColor}
          >
            <SimpleGrid columns={2} spacing={2}>
              <VStack align="start" spacing={1}>
                <HStack>
                  <Badge colorScheme="purple" fontSize="xs">
                    #{index + 1}
                  </Badge>
                  <Text fontSize="sm" fontWeight="medium" color={badgeColor}>
                    {item.puja_name}
                  </Text>
                </HStack>
                <HStack fontSize="xs">
                  <Icon as={CalendarIcon} color="gray.500" />
                  <Text>{new Date(item.date).toLocaleDateString()}</Text>
                </HStack>
              </VStack>
              <VStack align="end" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {`${item.first_name} ${item.last_name}`}
                </Text>
                <HStack fontSize="xs">
                  <Icon as={PhoneIcon} color="gray.500" />
                  <Text>{item.mobile_number}</Text>
                </HStack>
              </VStack>
            </SimpleGrid>

            <Divider my={2} />

            <Flex justifyContent="space-between" alignItems="start" fontSize="xs">
              <Text flexBasis="100%" pr={2}>
                {item.address1 || "No address provided"}
                {item.address2 ? `, ${item.address2}` : ""}
              </Text>
              {item.remarks && (
                <Flex alignItems="center" flexBasis="40%">
                  <Icon as={InfoIcon} color="blue.500" mr={1} />
                  <Text
                    fontStyle="italic"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {item.remarks}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Box>
        ))
      ) : (
        <Box
          textAlign="center"
          mt={4}
          p={4}
          borderRadius="md"
          bg={bgColor}
          borderColor={borderColor}
          borderWidth={1}
        >
          <Text>No pujas found for the selected date range.</Text>
        </Box>
      )}
    </Box>
  );
};

export default OnMobileViewPujaCards;


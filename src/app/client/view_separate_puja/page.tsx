"use client"

import * as React from "react"
import {
  Box,
  Container,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Select,
  Card,
  CardBody,
  Flex,
  Heading,
  Badge,
  useColorModeValue,
  Divider,
  HStack,
} from "@chakra-ui/react"
import { ChevronRightIcon, CalendarIcon, SunIcon, InfoIcon } from "@chakra-ui/icons"

interface Puja {
  id: string
  name: string
}

interface FamilyMember {
  name: string
  nakshatram_name_english: string
  nakshatram_name_hindi: string
  nakshatram_name_tamil: string
  gotram_name_english: string
  gotram_name_hindi: string
  gotram_name_tamil: string
  rashi_name_english: string
  rashi_name_hindi: string
  rashi_name_tamil: string
}

interface PujaBooking {
  puja_id: number
  booking_id: number
  date: string
  day: string
  remarks: string | null
  family_data: FamilyMember[]
}

export default function PujaList() {
  const [pujas, setPujas] = React.useState<Puja[]>([])
  const [selectedPuja, setSelectedPuja] = React.useState<string>("")
  const [results, setResults] = React.useState<PujaBooking[]>([])
  const [currentPujaIndex, setCurrentPujaIndex] = React.useState(0)
  const toast = useToast()

  const bgColor = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")
  const headingColor = useColorModeValue("blue.600", "blue.300")

  React.useEffect(() => {
    fetchPujas()
  }, [])

  const fetchPujas = async () => {
    try {
      const response = await fetch("/server/get_pujas")
      if (!response.ok) throw new Error("Failed to fetch pujas")

      const data = await response.json()
      setPujas([{ id: "", name: "All Pujas" }, ...data])
    } catch (error) {
      console.error("Error fetching pujas:", error)
      toast({
        title: "Error",
        description: "Failed to load pujas. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const fetchResults = async (pujaId: string) => {
    try {
      const queryParam = pujaId ? `?puja_id=${pujaId}` : ""
      const response = await fetch(`/server/getPujaForDay${queryParam}`)

      if (!response.ok) throw new Error("Failed to fetch results")

      const { success, data } = await response.json()
      if (success) {
        setResults(data)
        setCurrentPujaIndex(0) // Reset to first puja when new results are loaded
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      toast({
        title: "Error",
        description: "Failed to load results. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handlePujaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedPuja(value)
    fetchResults(value)
  }

  const handleNextPuja = () => {
    if (currentPujaIndex < results.length - 1) {
      setCurrentPujaIndex((prev) => prev + 1)
    }
  }

  const currentPuja = results[currentPujaIndex]
  const totalPujas = results.length
  const isLastPuja = currentPujaIndex === results.length - 1

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box maxW="md" mx="auto">
          <Select
            value={selectedPuja}
            onChange={handlePujaChange}
            placeholder="Select puja"
            size="lg"
            bg={bgColor}
            borderColor={borderColor}
            _hover={{ borderColor: "blue.500" }}
          >
            {pujas.map((puja) => (
              <option key={puja.id} value={puja.id}>
                {puja.name}
              </option>
            ))}
          </Select>
        </Box>

        {results.length > 0 && (
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Total number of results: {totalPujas}
          </Text>
        )}

        {currentPuja && (
          <Flex gap={4} align="flex-start">
            <Card
              flex="1"
              bg={bgColor}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="lg"
            >
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Heading size="lg" color={headingColor} textAlign="center">
                    {pujas.find((p) => p.id === currentPuja.puja_id.toString())?.name || "Puja"}
                  </Heading>
                  <Divider />
                  <HStack spacing={4} justify="center">
                    <Badge colorScheme="blue" p={2} borderRadius="full">
                      <HStack>
                        <CalendarIcon />
                        <Text>{formatDate(currentPuja.date)}</Text>
                      </HStack>
                    </Badge>
                    <Badge colorScheme="green" p={2} borderRadius="full">
                      <HStack>
                        <SunIcon />
                        <Text>{currentPuja.day}</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                  {currentPuja.remarks && (
                    <Box bg="yellow.100" p={3} borderRadius="md">
                      <HStack>
                        <InfoIcon color="yellow.500" />
                        <Text fontStyle="italic">{currentPuja.remarks}</Text>
                      </HStack>
                    </Box>
                  )}
                  <Table variant="simple" colorScheme="blue">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Nakshatram</Th>
                        <Th>Gotram</Th>
                        <Th>Rashi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentPuja.family_data.map((member, index) => (
                        <Tr key={`${currentPuja.booking_id}-${index}`}>
                          <Td fontWeight="bold">{member.name}</Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text>{member.nakshatram_name_english}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {member.nakshatram_name_hindi} / {member.nakshatram_name_tamil}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text>{member.gotram_name_english}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {member.gotram_name_hindi} / {member.gotram_name_tamil}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text>{member.rashi_name_english}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {member.rashi_name_hindi} / {member.rashi_name_tamil}
                              </Text>
                            </VStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </VStack>
              </CardBody>
            </Card>
            <IconButton
              aria-label="Next puja"
              icon={<ChevronRightIcon />}
              variant="outline"
              size="lg"
              onClick={handleNextPuja}
              isDisabled={isLastPuja}
            />
          </Flex>
        )}
      </VStack>
    </Container>
  )
}


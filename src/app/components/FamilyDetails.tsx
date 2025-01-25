import { useState } from "react"
import { Table, Thead, Tbody, Tr, Th, Td, IconButton, useToast } from "@chakra-ui/react"
import { ChevronRightIcon } from "@chakra-ui/icons"

interface PujaResult {
  id: string
  name: string
  nakshatram: string
  gotram: string
  rashi: string
}

interface PujaResultsTableProps {
  results: PujaResult[]
}

export function PujaResultsTable({ results }: PujaResultsTableProps) {
  const toast = useToast()

  const handleViewDetails = async (resultId: string) => {
    try {
      const response = await fetch(`/server/get_puja_details/${resultId}`)
      if (!response.ok) throw new Error("Failed to fetch details")

      const data = await response.json()
      // Handle the detailed data as needed
      console.log("Fetched details:", data)
    } catch (error) {
      console.error("Error fetching details:", error)
      toast({
        title: "Error",
        description: "Failed to load details. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Nakshatram</Th>
          <Th>Gotram</Th>
          <Th>Rashi</Th>
          <Th width="50px"></Th>
        </Tr>
      </Thead>
      <Tbody>
        {results.map((result) => (
          <Tr key={result.id}>
            <Td>{result.name}</Td>
            <Td>{result.nakshatram}</Td>
            <Td>{result.gotram}</Td>
            <Td>{result.rashi}</Td>
            <Td>
              <IconButton
                aria-label="View details"
                icon={<ChevronRightIcon />}
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetails(result.id)}
              />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}


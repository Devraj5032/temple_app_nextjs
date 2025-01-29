"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
// import { useDispatch } from "react-redux"
import { Box, Button, FormControl, FormLabel, Heading, Input, VStack, Text, useToast } from "@chakra-ui/react"
import { setUser } from "@/lib/features/user/userSlice"
import { useAppDispatch } from "@/lib/hooks"

export default function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()
  const dispatch = useAppDispatch()

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      toast({
        title: "Error",
        description: "Phone number and password are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/server/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          password: password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Dispatch user data to Redux store
        dispatch(setUser(data.user))

        toast({
          title: "Success",
          description: "Login successful",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: data.message || "Login failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while logging in",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 100px)">
      <Box bg="white" p={8} borderRadius="lg" boxShadow="lg" w={{ base: "90%", sm: "400px" }}>
        <Heading mb={6} textAlign="center">
          Login
        </Heading>
        <VStack
          as="form"
          spacing={4}
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
        >
          <FormControl>
            <FormLabel>Phone Number</FormLabel>
            <Input
              type="text"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <Button colorScheme="blue" width="full" type="submit" isLoading={isLoading}>
            Login
          </Button>
        </VStack>
        <Text mt={4} textAlign="center" fontSize="sm" color="gray.500">
          Forgot your password? Contact support.
        </Text>
      </Box>
    </Box>
  )
}


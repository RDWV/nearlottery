import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Grid,
  theme,
  Container,
  Heading,
  Button,
  Input,
  Text,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackDivider,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Badge,
} from '@chakra-ui/react';
import { Wallet } from './utils/near-wallet';

const CONTRACT_ID = 'your-contract-id.testnet'; // Replace with your contract ID

function App() {
  const [wallet, setWallet] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');
  const [lotteryId, setLotteryId] = useState('');
  const [lotteryDetails, setLotteryDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      const wallet = new Wallet({ contractId: CONTRACT_ID });
      const isSignedIn = await wallet.startUp();
      setWallet(wallet);
      setIsSignedIn(isSignedIn);
    };
    init();
  }, []);

  const handleCreateLottery = async () => {
    try {
      setIsLoading(true);
      await wallet.createLottery(ticketPrice);
      toast({
        title: 'Success',
        description: 'Lottery created successfully!',
        status: 'success',
        duration: 5000,
      });
      setTicketPrice('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyTicket = async () => {
    try {
      setIsLoading(true);
      const details = await wallet.getLottery(parseInt(lotteryId));
      if (!details) throw new Error('Lottery not found');
      await wallet.buyTicket(parseInt(lotteryId), details[1]);
      toast({
        title: 'Success',
        description: 'Ticket purchased successfully!',
        status: 'success',
        duration: 5000,
      });
      await loadLotteryDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndLottery = async () => {
    try {
      setIsLoading(true);
      await wallet.endLottery(parseInt(lotteryId));
      toast({
        title: 'Success',
        description: 'Lottery ended successfully!',
        status: 'success',
        duration: 5000,
      });
      await loadLotteryDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLotteryDetails = async () => {
    if (!lotteryId) return;
    try {
      setIsLoading(true);
      const details = await wallet.getLottery(parseInt(lotteryId));
      if (!details) throw new Error('Lottery not found');
      setLotteryDetails(details);
      const participantsList = await wallet.getParticipants(parseInt(lotteryId));
      setParticipants(participantsList);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!wallet) {
    return null;
  }

  return (
    <ChakraProvider theme={theme}>
      <Box textAlign="center" fontSize="xl" p={5}>
        <Grid minH="100vh">
          <Container maxW="container.md">
            <VStack spacing={8}>
              <Heading size="2xl" mb={8}>
                NEAR Lottery
              </Heading>

              {!isSignedIn ? (
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={() => wallet.signIn()}
                >
                  Sign In with NEAR
                </Button>
              ) : (
                <VStack spacing={8} width="100%">
                  <Card width="100%">
                    <CardHeader>
                      <Heading size="md">Create New Lottery</Heading>
                    </CardHeader>
                    <CardBody>
                      <FormControl>
                        <FormLabel>Ticket Price (in NEAR)</FormLabel>
                        <NumberInput min={0}>
                          <NumberInputField
                            value={ticketPrice}
                            onChange={(e) => setTicketPrice(e.target.value)}
                            placeholder="Enter ticket price"
                          />
                        </NumberInput>
                        <Button
                          mt={4}
                          colorScheme="green"
                          onClick={handleCreateLottery}
                          isLoading={isLoading}
                          width="100%"
                        >
                          Create Lottery
                        </Button>
                      </FormControl>
                    </CardBody>
                  </Card>

                  <Card width="100%">
                    <CardHeader>
                      <Heading size="md">Lottery Actions</Heading>
                    </CardHeader>
                    <CardBody>
                      <Stack spacing={4}>
                        <FormControl>
                          <FormLabel>Lottery ID</FormLabel>
                          <NumberInput min={0}>
                            <NumberInputField
                              value={lotteryId}
                              onChange={(e) => setLotteryId(e.target.value)}
                              placeholder="Enter lottery ID"
                            />
                          </NumberInput>
                        </FormControl>
                        <Button
                          colorScheme="blue"
                          onClick={loadLotteryDetails}
                          isLoading={isLoading}
                        >
                          Load Lottery Details
                        </Button>
                        <Button
                          colorScheme="purple"
                          onClick={handleBuyTicket}
                          isLoading={isLoading}
                        >
                          Buy Ticket
                        </Button>
                        <Button
                          colorScheme="orange"
                          onClick={handleEndLottery}
                          isLoading={isLoading}
                        >
                          End Lottery
                        </Button>
                      </Stack>
                    </CardBody>
                  </Card>

                  {lotteryDetails && (
                    <Card width="100%">
                      <CardHeader>
                        <Heading size="md">Lottery Details</Heading>
                      </CardHeader>
                      <CardBody>
                        <Stack divider={<StackDivider />} spacing={4}>
                          <Box>
                            <Text>
                              <strong>Owner:</strong> {lotteryDetails[0]}
                            </Text>
                            <Text>
                              <strong>Ticket Price:</strong>{" "}
                              {lotteryDetails[1] / 10 ** 24} NEAR
                            </Text>
                            <Text>
                              <strong>Status:</strong>{" "}
                              <Badge
                                colorScheme={lotteryDetails[2] ? "green" : "red"}
                              >
                                {lotteryDetails[2] ? "Active" : "Ended"}
                              </Badge>
                            </Text>
                            <Text>
                              <strong>Winner:</strong>{" "}
                              {lotteryDetails[3] || "Not determined"}
                            </Text>
                            <Text>
                              <strong>Number of Participants:</strong>{" "}
                              {lotteryDetails[4]}
                            </Text>
                          </Box>
                          <Box>
                            <Heading size="sm" mb={2}>
                              Participants
                            </Heading>
                            {participants.length > 0 ? (
                              participants.map((participant, index) => (
                                <Text key={index}>{participant}</Text>
                              ))
                            ) : (
                              <Text color="gray.500">No participants yet</Text>
                            )}
                          </Box>
                        </Stack>
                      </CardBody>
                    </Card>
                  )}

                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() => wallet.signOut()}
                  >
                    Sign Out
                  </Button>
                </VStack>
              )}
            </VStack>
          </Container>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App; 
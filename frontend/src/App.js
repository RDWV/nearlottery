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
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      const wallet = new Wallet({ contractId: CONTRACT_ID });
      await wallet.startUp();
      setWallet(wallet);
      setIsSignedIn(!!wallet.accountId);
    };
    init();
  }, []);

  const handleCreateLottery = async () => {
    try {
      await wallet.createLottery(ticketPrice);
      toast({
        title: 'Lottery Created',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Error creating lottery',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleBuyTicket = async () => {
    try {
      await wallet.buyTicket(parseInt(lotteryId), ticketPrice);
      toast({
        title: 'Ticket Purchased',
        status: 'success',
        duration: 5000,
      });
      await loadLotteryDetails();
    } catch (error) {
      toast({
        title: 'Error buying ticket',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleEndLottery = async () => {
    try {
      await wallet.endLottery(parseInt(lotteryId));
      toast({
        title: 'Lottery Ended',
        status: 'success',
        duration: 5000,
      });
      await loadLotteryDetails();
    } catch (error) {
      toast({
        title: 'Error ending lottery',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const loadLotteryDetails = async () => {
    if (!lotteryId) return;
    try {
      const details = await wallet.viewLottery(parseInt(lotteryId));
      setLotteryDetails(details);
      const participantsList = await wallet.getParticipants(parseInt(lotteryId));
      setParticipants(participantsList);
    } catch (error) {
      toast({
        title: 'Error loading lottery details',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (!wallet) {
    return null;
  }

  return (
    <ChakraProvider theme={theme}>
      <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
          <Container>
            <VStack spacing={8}>
              <Heading>NEAR Lottery</Heading>
              
              {!isSignedIn ? (
                <Button onClick={() => wallet.signIn()}>Sign In with NEAR</Button>
              ) : (
                <VStack spacing={8} width="100%">
                  <Card width="100%">
                    <CardHeader>
                      <Heading size="md">Create New Lottery</Heading>
                    </CardHeader>
                    <CardBody>
                      <Stack spacing={4}>
                        <Input
                          placeholder="Ticket Price (in NEAR)"
                          value={ticketPrice}
                          onChange={(e) => setTicketPrice(e.target.value)}
                        />
                        <Button onClick={handleCreateLottery}>Create Lottery</Button>
                      </Stack>
                    </CardBody>
                  </Card>

                  <Card width="100%">
                    <CardHeader>
                      <Heading size="md">Lottery Actions</Heading>
                    </CardHeader>
                    <CardBody>
                      <Stack spacing={4}>
                        <Input
                          placeholder="Lottery ID"
                          value={lotteryId}
                          onChange={(e) => setLotteryId(e.target.value)}
                        />
                        <Button onClick={loadLotteryDetails}>Load Lottery Details</Button>
                        <Button onClick={handleBuyTicket}>Buy Ticket</Button>
                        <Button onClick={handleEndLottery}>End Lottery</Button>
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
                            <Text>Owner: {lotteryDetails[0]}</Text>
                            <Text>Ticket Price: {lotteryDetails[1]} NEAR</Text>
                            <Text>Active: {lotteryDetails[2] ? 'Yes' : 'No'}</Text>
                            <Text>Winner: {lotteryDetails[3] || 'Not determined'}</Text>
                            <Text>Number of Participants: {lotteryDetails[4]}</Text>
                          </Box>
                          <Box>
                            <Heading size="sm">Participants</Heading>
                            {participants.map((participant, index) => (
                              <Text key={index}>{participant}</Text>
                            ))}
                          </Box>
                        </Stack>
                      </CardBody>
                    </Card>
                  )}

                  <Button onClick={() => wallet.signOut()}>Sign Out</Button>
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
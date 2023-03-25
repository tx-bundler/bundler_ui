import {
  Box,
  Button,
  Container,
  Stack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Link,
  Input,
} from "@chakra-ui/react";
import styles from "../../styles/Home.module.css";
import SwapModal from "../../components/SwapModal";
import SwapTableModal from "../../components/SwapTableModal";
import TokensBalanceDisplay from "../../components/tokensBalanceDisplay";
import { useRouter } from "next/router";
import Image from "next/image";
import React, { FC, useEffect, useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { IEthereumProvider } from '@argent/login-react';
import * as zksync from 'zksync-web3';
import {
  useAccount,
  useNetwork,usePrepareContractWrite, useContractWrite,useWaitForTransaction, useContract, useBalance, useContractRead, useProvider, useSigner
} from "wagmi";
import { VaultAbi } from  "../../constants/abis/VaultAbi";
import { PoolAbi }  from "../../constants/abis//PoolAbi";
import { RouterAbi }  from "../../constants/abis/RouterAbi";
import { factoryAbi }  from "../../constants/abis/PoolFactory";
import { testAbi }  from "../../constants/abis/testAbi";
import { LendingAbi } from "@/constants/abis/LendingAbi";


export default function Swap() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { address, isConnected, isDisconnected } = useAccount();

  const LENDING_ADDRESS = "0xA7c9A38e77290420eD06cf54d27640dE27399eB1";

  const WETH_ADDRESS = "0x20b28B1e4665FFf290650586ad76E977EAb90c5D";
  const DAI_ADDRESS = "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b";
  const DAI_DECIMALS = 18;
  const VAULT_CONTRACT_ADDRESS = "0x4Ff94F499E1E69D687f3C3cE2CE93E717a0769F8";
  const POOL_ADDRESS = "0xe52940eDDa6ec5FDabef7C33B9C1E1d613BbA144"; // ETH/DAI
  const ROUTER_ADDRESS = "0xB3b7fCbb8Db37bC6f572634299A58f51622A847e";
  const POOLFACTORY_ADDRESS = "0xf2FD2bc2fBC12842aAb6FbB8b1159a6a83E72006"; // Classic
  const ADDRESS_ZERO = ethers.constants.AddressZero;
  const ercAbi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    // Authenticated Functions
    "function transfer(address to, uint amount) returns (bool)",
    "function deposit() public payable",
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

/* 
   ___   ____   ___   ___   ____  _      __  ____ ______ __ __ ____ ___            _  __   __     __  __ ____ ___   _____
  / _ ) / __ \ / _ \ / _ \ / __ \| | /| / / / __//_  __// // // __// _ \  _    __ (_)/ /_ / /    / / / // __// _ \ / ___/
 / _  |/ /_/ // , _// , _// /_/ /| |/ |/ / / _/   / /  / _  // _/ / , _/ | |/|/ // // __// _ \  / /_/ /_\ \ / // // /__  
/____/ \____//_/|_|/_/|_| \____/ |__/|__/ /___/  /_/  /_//_//___//_/|_|  |__,__//_/ \__//_//_/  \____//___//____/ \___/  
*/
  const [usdcAmount, setUsdcAmount] = useState(0)

  const {config: config2} = usePrepareContractWrite({
    address: LENDING_ADDRESS,
    abi: LendingAbi,
    functionName: 'borrowEther',
    args: [usdcAmount]
  })

  const { data: data2, isLoading: isLoading2, isSuccess: isSuccess2, write: write2 } = useContractWrite(config2)


/*
   ___    ___   ___   ___   ____  _   __ ____  _      __ ____ ______ __ __  
  / _ |  / _ \ / _ \ / _ \ / __ \| | / // __/ | | /| / // __//_  __// // /  
 / __ | / ___// ___// , _// /_/ /| |/ // _/   | |/ |/ // _/   / /  / _  /   
/_/ |_|/_/   /_/   /_/|_| \____/ |___//___/   |__/|__//___/  /_/  /_//_/    
*/

  const MAX_APPROVE = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

  const { config: config1 } = usePrepareContractWrite({
    address: WETH_ADDRESS,
    abi: ercAbi,
    functionName: 'approve',
    args: [ROUTER_ADDRESS, MAX_APPROVE],
  })
  const { data: data1, isLoading: isLoading1, isSuccess: isSuccess1, write: write1 } = useContractWrite(config1)

  async function handleApprove(){
    write1?.()
  }


/* 
   ____ _      __ ___    ___    ____ ______ __ __ ____ ___    ______ ____    ___   ___    ____          _  __   __     ______  __ _  __ _____ ____ _      __ ___    ___ 
  / __/| | /| / // _ |  / _ \  / __//_  __// // // __// _ \  /_  __// __ \  / _ \ / _ |  /  _/ _    __ (_)/ /_ / /    / __/\ \/ // |/ // ___// __/| | /| / // _ |  / _ \
 _\ \  | |/ |/ // __ | / ___/ / _/   / /  / _  // _/ / , _/   / /  / /_/ / / // // __ | _/ /  | |/|/ // // __// _ \  _\ \   \  //    // /__ _\ \  | |/ |/ // __ | / ___/
/___/  |__/|__//_/ |_|/_/    /___/  /_/  /_//_//___//_/|_|   /_/   \____/ /____//_/ |_|/___/  |__,__//_/ \__//_//_/ /___/   /_//_/|_/ \___//___/  |__/|__//_/ |_|/_/    
*/

  const value = ethers.utils.parseEther("0.001");

  const withdrawMode = 2; // 1 or 2 to withdraw to user's wallet

  const swapData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint8"],
    [WETH_ADDRESS, "0x079217e9a45A0e4B49C3cb9B6D93b127513D1F07", withdrawMode] // tokenIn, to, withdraw mode
  );
  const steps = [
    {
      pool: POOL_ADDRESS,
      data: swapData,
      callback: ADDRESS_ZERO, // we don't have a callback
      callbackData: "0x",
    },
  ];
  const nativeETHAddress = ADDRESS_ZERO;
  const paths = [
    {
      steps: steps,
      tokenIn: nativeETHAddress,
      amountIn: value,
    },
  ];

  const { config: config3 } = usePrepareContractWrite({
    address: ROUTER_ADDRESS,
    abi: RouterAbi,
    functionName: 'swap',
    args: [
      paths, // paths
      0, // amountOutMin // Note: ensures slippage here
      Math.floor(Date.now() / 1000) + 60 * 10, // deadline // 10 minutes
    ],
    overrides: {
      from: "0x079217e9a45A0e4B49C3cb9B6D93b127513D1F07", // useAccountAddress
      value: value
    },
  })

  const contract = useContract({
    address: ROUTER_ADDRESS,
    abi: RouterAbi,
  })

  const provider = useProvider()
  const { data: signer, isError, isLoading } = useSigner()

  const Router = new ethers.Contract(ROUTER_ADDRESS, RouterAbi, signer);
  
  async function handleSwap() {
    console.log("write3 button works?")
    console.log("config 3", config3)
    console.log(contract)

    const response = await Router.swap(
      paths, // paths
      0, // amountOutMin // Note: ensures slippage here
      Math.floor(Date.now() / 1000) + 60 * 10, // deadline // 10 minutes
      {
        value: value,
      }
    );
  
    const tx_receipt = await response.wait();
  
    console.log("receipt: ", tx_receipt);
  }

/* 
   __  ___ __  __ __  ______ ____ _____ ___    __    __ 
  /  |/  // / / // / /_  __//  _// ___// _ |  / /   / / 
 / /|_/ // /_/ // /__ / /  _/ / / /__ / __ | / /__ / /__
/_/  /_/ \____//____//_/  /___/ \___//_/ |_|/____//____/
*/  

const multicallInterface = new ethers.utils.Interface([
  "function multicall(tuple(address to, uint256 value, bytes data)[] _transactions)",
]);


const Lender = new ethers.Contract(LENDING_ADDRESS, LendingAbi, signer);
const WETH = new ethers.Contract(WETH_ADDRESS, ercAbi, signer);
// WE have already Router Contract = Router

// For balance check DAI Contract:
const DAI = new ethers.Contract(DAI_ADDRESS, ercAbi, signer);

async function handleMulticall() {
  const accountAddress = await signer.getAddress();
  const account = new ethers.Contract(accountAddress, multicallInterface, signer);

  let DAI_BALANCE = DAI.balanceOf(signer?.getAddress())
  console.log("DAI Balance BEFORE of the user: ", DAI_BALANCE)

  const calls = [
    {
      to: Lender.address,
      value: 0,
      data: Lender.interface.encodeFunctionData("borrowEther", [usdcAmount])
    },
    {
      to: WETH.address,
      value:0,
      data: WETH.interface.encodeFunctionData("approve", [ROUTER_ADDRESS, MAX_APPROVE])
    },
    {
      to: Router.address,
      value: value,
      data: Router.interface.encodeFunctionData("swap", [paths, 0, Math.floor(Date.now() / 1000) + 60 * 10])
    }
  ]

  const response = await account.multicall(calls, { from: accountAddress }); // send to account itself
  const result = await response.wait();

  console.log("Multicall! HERE: ", result)

  DAI_BALANCE = await DAI.balanceOf(signer?.getAddress())
  console.log("DAI Balance AFTER of the user: ", DAI_BALANCE)
}




/* 
  __  __ ____
 / / / //  _/
/ /_/ /_/ /  
\____//___/  
             
*/

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  return (
    <div>
      <main className={styles.main}>
        <Container maxW={"3xl"}>
          <Stack
            as={Box}
            textAlign={"center"}
            spacing={{ base: 10, md: 20 }}
            py={{ base: 10, md: 20 }}
          >
            <Heading
              fontWeight={700}
              fontSize={{ base: "2xl", sm: "4xl", md: "6xl" }}
              lineHeight={"110%"}
            >
              Batch transactions, made
              <br />
              <Text as={"span"} fontWeight={700} color={"blue.500"}>
                simple.
              </Text>
            </Heading>

            <Stack>
              <Container centerContent maxW={"3xl"} py={8}>
                <Text color={"gray.600"}
                  fontWeight={500}
                  fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
                  padding={10}
                >
                  Not Enough ETH? Dont be sad! Use our one-click LENDING & SWAP Protocol!! <br />
                  Also paymaster will pay your gas fee!!! <br /> <br />
                  You have USDC: <br /> 
                  
                  USDC --&#62; ETH --&#62; WETH --&#62; DAI (One Click)

                  USDC --&#62; ETH --&#62; WETH --&#62; APPROVE --&#62; DAI

                  <br />
                  <br />
                  <Button disabled={!write1} onClick={handleApprove}> Approve</Button>
                  <Input onChange={e => setUsdcAmount(parseInt(e.target.value, 10))}></Input>
                  <Button onClick={() => write2?.()}> BORROW </Button>
                  <Button onClick={handleSwap}> SWAP </Button>
                  <Button onClick={handleMulticall}> MULTICALL FUCK YEAH! </Button>

                  {isLoading1 && <div>Check Wallet</div>}
                  {isSuccess1 && <div>Transaction: {JSON.stringify(data1)}</div>}
                  {isSuccess2 && <div>Transaction: {JSON.stringify(data2)}</div>}

                  <SwapModal isOpen={isOpen} onClose={() => setIsOpen(false)} /> 

                </Text>
              </Container>
              <Container centerContent maxW={"3xl"} py={8}>
                <Text
                  color={"gray.600"}
                  fontWeight={500}
                  fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
                  padding={10}
                >
                  One-Click AAVE Swaps
                  <br />
                  <br />
                  Deposit ETH into AAVE(any lending on protocool on zkSync
                  testnet), withdraw USDC and swap ETH to perform desired
                  action.
                </Text>
                <SwapModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
              </Container>
              <hr />
              <br />
              <br />
              <Heading>Coming soon...</Heading>
              <br />
              <br />
              <hr />
              <Container centerContent maxW={"3xl"} py={8}>
                <Text
                  color={"gray.600"}
                  fontWeight={500}
                  fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
                  padding={10}
                >
                  One-Click DEX Swaps
                  <br />
                  <br />
                  ....
                </Text>

                <SwapModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
              </Container>

              <Container centerContent maxW={"3xl"} py={8}>
                <Text
                  color={"gray.600"}
                  fontWeight={500}
                  fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
                  padding={10}
                >
                  One-Click NFT Purchase
                  <br />
                  <br />
                  ....
                </Text>
                <Button
                  fontSize="24px"
                  colorScheme={"blue"}
                  rounded={"full"}
                  px={12}
                  py={8}
                  onClick={() => router.push("/swap")}
                  _hover={{
                    bg: "orange.500",
                  }}
                >
                  Swap
                </Button>
              </Container>

              <Container centerContent maxW={"3xl"} py={8}>
                <Text
                  color={"gray.600"}
                  fontWeight={500}
                  fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
                  padding={10}
                >
                  GMX Swap
                  <br />
                  <br />
                  ....
                </Text>
                <Button
                  fontSize="24px"
                  colorScheme={"blue"}
                  rounded={"full"}
                  px={12}
                  py={8}
                  onClick={() => router.push("/swap")}
                  _hover={{
                    bg: "red.500",
                  }}
                >
                  Swap
                </Button>
              </Container>

              <Container centerContent maxW={"3xl"} py={8}>
                <Text
                  color={"gray.600"}
                  fontWeight={500}
                  fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
                  padding={10}
                >
                  One-Click Yearn Swaps
                  <br />
                  <br />
                  ....
                </Text>
                <Button
                  fontSize="24px"
                  colorScheme={"blue"}
                  rounded={"full"}
                  px={12}
                  py={8}
                  onClick={() => router.push("/swap")}
                  _hover={{
                    bg: "orange.500",
                  }}
                >
                  Swap
                </Button>
              </Container>

              <Container centerContent maxW={"3xl"} py={8}>
                <Text
                  color={"gray.600"}
                  fontWeight={500}
                  fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
                  padding={10}
                >
                  Private Swaps
                  <br />
                  <br />
                  ....
                </Text>
                <Button
                  fontSize="24px"
                  colorScheme={"blue"}
                  rounded={"full"}
                  px={12}
                  py={8}
                  onClick={() => router.push("/swap")}
                  _hover={{
                    bg: "black",
                  }}
                >
                  Swap
                </Button>
              </Container>
            </Stack>
          </Stack>

          <Container
              centerContent
              maxW={"3xl"}
              fontWeight={500}
              fontSize={{ base: "xl", sm: "xl", md: "2xl" }}
            >
              <Text fontWeight={500}>List of zkSync Testnet Tokens:</Text>
              <br />
              <Link href="https://zksync2-testnet.zkscan.io/tokens">
                https://zksync2-testnet.zkscan.io/tokens
              </Link>
            </Container>

                       <br />   

          {/* Hard-Coded Table */}
          <Container maxW={"3xl"}>
            <TableContainer>
              <Table
                style={{ borderCollapse: "separate", borderSpacing: "0 1em" }}
                variant="simple"
                size="md"
              >
                <Thead>
                  <Tr>
                    <Th>Available DEX</Th>
                    <Th isNumeric>Liquidity ~Simulated~</Th>
                    <Th isNumeric>ROI ~Simulated~</Th>
                    <Th></Th>
                  </Tr>
                </Thead>

                <Tbody>
                  <Tr>
                    <Td>Mute.io</Td>
                    <Td isNumeric>$322,660</Td>
                    <Td isNumeric>14.25%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Uniswap</Td>
                    <Td isNumeric>$693,901</Td>
                    <Td isNumeric>11.2%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Sushi</Td>
                    <Td isNumeric>$910,789</Td>
                    <Td isNumeric>13.45%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Balancer</Td>
                    <Td isNumeric>$317,715</Td>
                    <Td isNumeric>20.91%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>ParaSwap</Td>
                    <Td isNumeric>$81,398</Td>
                    <Td isNumeric>10.5%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>SyncSwap</Td>
                    <Td isNumeric>$836,283</Td>
                    <Td isNumeric>22.3%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>ZigZag</Td>
                    <Td isNumeric>$862,508</Td>
                    <Td isNumeric>12.1%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Hashflow</Td>
                    <Td isNumeric>$670,939</Td>
                    <Td isNumeric>15.4%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Ondefy</Td>
                    <Td isNumeric>$361,603</Td>
                    <Td isNumeric>16.2%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Swapsicle</Td>
                    <Td isNumeric>$387,390</Td>
                    <Td isNumeric>73.2%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>UniDex</Td>
                    <Td isNumeric>$616,035</Td>
                    <Td isNumeric>32.3%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Izumi</Td>
                    <Td isNumeric>$195,776</Td>
                    <Td isNumeric>18.4%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>MUX</Td>
                    <Td isNumeric>$509,734</Td>
                    <Td isNumeric>22.4%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                  <Tr>
                    <Td>Primex</Td>
                    <Td isNumeric>$411,340 </Td>
                    <Td isNumeric>15.2%</Td>
                    <SwapTableModal
                      isOpen={isOpen}
                      onClose={() => setIsOpen(false)}
                    />
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </Container>
        </Container>
      </main>
    </div>
  );
}

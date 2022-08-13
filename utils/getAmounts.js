import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  DAO_CONTRACT_ADDRESS,
  DAO_CONTRACT_ABI
} from "../constants";

/**
 * getEtherBalance: Retrieves the ether balance of the user or the contract
 */
export const getEtherBalance = async (
  provider,
  address,
  contract = false
) => {
  try {
    // If the caller has set the `contract` boolean to true, retrieve the balance of
    // ether in the `exchange contract`, if it is set to false, retrieve the balance
    // of the user's address
    if (contract) {
      const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
      return balance;
    } else {
      const balance = await provider.getBalance(address);
      return balance;
    }
  } catch (err) {
    console.error(err);
    return 0;
  }
};

/**
 * getCDTokensBalance: Retrieves the Crypto Dev tokens in the account
 * of the provided `address`
 */
export const getTokensBalance = async (provider, address, tokenAddress) => {
  try {
    const tokenContract = new Contract(
      tokenAddress,
      TOKEN_CONTRACT_ABI,
      provider
    );
    const balanceOfCryptoDevTokens = await tokenContract.balanceOf(address);
    return balanceOfCryptoDevTokens;
  } catch (err) {
    console.error(err);
  }
};

/**
 * getLPTokensBalance: Retrieves the amount of LP tokens in the account
 * of the provided `address`
 */
export const getLPTokensBalance = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const balanceOfLPTokens = await exchangeContract.balanceOf(address);
    return balanceOfLPTokens;
  } catch (err) {
    console.error(err);
  }
};


export const getDexTokenBalance = async (provider, walletAddress) => {
  try {
    const exchangeContract = new Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      provider
    );
    const balanceOfDexTokens = await exchangeContract.balanceOf(walletAddress);
    return balanceOfDexTokens;
  } catch (err) {
    console.error(err);
  }
};

export const getEthinPool = (listPools, tokenAddress) => {
  const balance = 0;
  for(var i =0; i < listPools.length; i++) {
    if(listPools[i].tokenAddress.toString() === tokenAddress){
       balance = listPools[i].ethReservedBalance;
    }
  }
  return balance;
}

export const getTokeninPool = (listPools, tokenAddress) => {
  const balance = 0;
  for(var i =0; i < listPools.length; i++) {
    if(listPools[i].tokenAddress.toString() === tokenAddress){
      balance = listPools[i].tokenReservedBalance;
    }
  }
  return balance;
}

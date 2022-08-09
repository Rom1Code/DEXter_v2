import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
} from "../constants";

/**
 * addLiquidity helps add liquidity to the exchange,
 * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
 * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
 * then we calculate the Crypto Dev tokens he can add, given the Eth he wants to add by keeping the ratios
 * constant
 */
export const addLiquidity = async (
  signer,
  addTokenAmountWei,
  addEtherAmountWei, poolId, tokenAddress
) => {
  console.log("addLiquidity", poolId)
  console.log("tokenAddress", tokenAddress)

  try {
    // create a new instance of the token contract
    const tokenContract = new Contract(
      tokenAddress,
      TOKEN_CONTRACT_ABI,
      signer
    );
    // create a new instance of the exchange contract
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
    // Because CD tokens are an ERC20, user would need to give the contract allowance
    // to take the required number CD tokens out of his contract
    let tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      addTokenAmountWei.toString()
    );
    await tx.wait();
    // After the contract has the approval, add the ether and cd tokens in the liquidity
    tx = await exchangeContract.addLiquidity(addTokenAmountWei, poolId, tokenAddress, {
      value: addEtherAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};

/**
 * calculateCD calculates the CD tokens that need to be added to the liquidity
 * given `_addEtherAmountWei` amount of ether
 */
export const calculateToken = async (
  _addEther = "0",
  etherBalanceContract,
  tokenReserve
) => {
  // `_addEther` is a string, we need to convert it to a Bignumber before we can do our calculations
  // We do that using the `parseEther` function from `ethers.js`
  const _addEtherAmountWei = utils.parseEther(_addEther);

  // Ratio needs to be maintained when we add liquidty.
  // We need to let the user know for a specific amount of ether how many `CD` tokens
  // He can add so that the price impact is not large
  // The ratio we follow is (amount of Crypto Dev tokens to be added) / (Crypto Dev tokens balance) = (Eth that would be added) / (Eth reserve in the contract)
  // So by maths we get (amount of Crypto Dev tokens to be added) = (Eth that would be added * Crypto Dev tokens balance) / (Eth reserve in the contract)

  const tokenAmount = _addEtherAmountWei
    .mul(tokenReserve)
    .div(etherBalanceContract);
  return tokenAmount;
};


/**
* removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
* liquidity and also the calculated amount of `ether` and `CD` tokens
*/
export const removeLiquidity = async (signer, removeLPTokensWei, poolId, tokenAddress) => {
  // Create a new instance of the exchange contract

  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    signer
  );
  const tx = await exchangeContract.removeLiquidity(removeLPTokensWei, poolId, tokenAddress);
  await tx.wait();
};

/**
* getTokensAfterRemove: Calculates the amount of `Eth` and `CD` tokens
* that would be returned back to user after he removes `removeLPTokenWei` amount
* of LP tokens from the contract
*/
export const getTokensAfterRemove = async (
  provider,
  removeLPTokenWei,
  _ethBalance,
  tokenReserve,
  lpBalance,
) => {
  console.log("removeLPTokenWei",removeLPTokenWei.toString())
  console.log("_ethBalance",_ethBalance.toString())
  console.log("tokenReserve",tokenReserve.toString())
  console.log("lpBalance",lpBalance.toString())

    // Create a new instance of the exchange contract
    // Get the total supply of `Crypto Dev` LP tokens
    const _totalSupply = lpBalance;

    // Here we are using the BigNumber methods of multiplication and division
    // The amount of Eth that would be sent back to the user after he withdraws the LP token
    // is calculated based on a ratio,
    // Ratio is -> (amount of Eth that would be sent back to the user / Eth reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
    // By some maths we get -> (amount of Eth that would be sent back to the user) = (Eth Reserve * LP tokens withdrawn) / (total supply of LP tokens)
    // Similarly we also maintain a ratio for the `CD` tokens, so here in our case
    // Ratio is -> (amount of CD tokens sent back to the user / CD Token reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
    // Then (amount of CD tokens sent back to the user) = (CD token reserve * LP tokens withdrawn) / (total supply of LP tokens)
    const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
    console.log("_removeEther",_removeEther.toString())
    const _removeCD = tokenReserve
      .mul(removeLPTokenWei)
      .div(_totalSupply);
    return {
      _removeEther,
      _removeCD,
    };
};

export const getNbPool = async (provider) => {
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    provider);
    //console.log(await exchangeContract.name())
  const nbPool= await exchangeContract.nbPool();
  return nbPool;
}


export const fetchAllPools = async (provider, nbPool, walletAddress) => {
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    provider);
  const listPoolsWithLP = [];
  const listPools = [];
  const listLPToken = []
  listLPToken.push(0)
  const balanceOfTokens = []
  balanceOfTokens.push(0)

  for(var i=1; i<=nbPool; i++){
    //we save the pool with liquidity in listPools in order to display only
    //token with liquidty for the swap
    const tempPool = await exchangeContract.pools(i)
    listPools.push(tempPool);

    if(tempPool.tokenReservedBalance != 0) {
    listPoolsWithLP.push(tempPool);
    }
    //we save the LP token for the pool in which the user add liquidity
    const tempLP = await exchangeContract.nbLPbyPool(i, walletAddress)
    listLPToken.push(tempLP)

    const tokenContract = new Contract(
      tempPool.tokenAddress,
      TOKEN_CONTRACT_ABI,
      provider
    );
    const tempBalance = await tokenContract.balanceOf(walletAddress);
    balanceOfTokens.push(tempBalance)

  }
  return [listPools, balanceOfTokens, listLPToken, listPoolsWithLP] ;
}
